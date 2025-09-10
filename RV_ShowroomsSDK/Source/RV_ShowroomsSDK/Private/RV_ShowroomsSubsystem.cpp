#include "RV_ShowroomsSubsystem.h"

#include "HttpModule.h"
#include "Interfaces/IHttpResponse.h"
#include "Json.h"
#include "JsonObjectConverter.h"

void URV_ShowroomsSubsystem::Initialize(FSubsystemCollectionBase& Collection)
{
	Super::Initialize(Collection);
}

bool URV_ShowroomsSubsystem::EnsureApiUrl()
{
	if (ApiBaseUrl.IsEmpty())
	{
		UE_LOG(LogTemp, Warning, TEXT("RV_ShowroomsSubsystem ApiBaseUrl is empty."));
		return false;
	}
	return true;
}

void URV_ShowroomsSubsystem::ListShowrooms()
{
	if (!EnsureApiUrl()) { OnListShowroomsCompleted.Broadcast({}, TEXT("Missing ApiBaseUrl")); return; }

	const FString Url = ApiBaseUrl.TrimEnd().TrimEndChar('/') + TEXT("/api/showroom/games");

	TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Request = FHttpModule::Get().CreateRequest();
	Request->OnProcessRequestComplete().BindLambda([this](FHttpRequestPtr Req, FHttpResponsePtr Resp, bool bOk)
	{
		if (!bOk || !Resp.IsValid())
		{
			OnListShowroomsCompleted.Broadcast({}, TEXT("Network error"));
			return;
		}

		if (Resp->GetResponseCode() >= 200 && Resp->GetResponseCode() < 300)
		{
			TArray<FRV_ShowroomSummary> Out;
			if (ParseShowroomsJson(Resp->GetContentAsString(), Out))
			{
				OnListShowroomsCompleted.Broadcast(Out, TEXT(""));
			}
			else
			{
				OnListShowroomsCompleted.Broadcast({}, TEXT("Parse error"));
			}
		}
		else
		{
			OnListShowroomsCompleted.Broadcast({}, FString::Printf(TEXT("HTTP %d"), Resp->GetResponseCode()));
		}
	});

	Request->SetURL(Url);
	Request->SetVerb(TEXT("GET"));
	Request->SetHeader(TEXT("Accept"), TEXT("application/json"));
	Request->ProcessRequest();
}

void URV_ShowroomsSubsystem::GetShowroomById(const FString& ShowroomId)
{
	if (!EnsureApiUrl()) { OnGetShowroomCompleted.Broadcast(FRV_ShowroomDetails(), TEXT("Missing ApiBaseUrl")); return; }

	const FString Url = ApiBaseUrl.TrimEnd().TrimEndChar('/') + TEXT("/api/showroom/games/") + ShowroomId;

	TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Request = FHttpModule::Get().CreateRequest();
	Request->OnProcessRequestComplete().BindLambda([this](FHttpRequestPtr Req, FHttpResponsePtr Resp, bool bOk)
	{
		if (!bOk || !Resp.IsValid())
		{
			OnGetShowroomCompleted.Broadcast(FRV_ShowroomDetails(), TEXT("Network error"));
			return;
		}

		if (Resp->GetResponseCode() >= 200 && Resp->GetResponseCode() < 300)
		{
			FRV_ShowroomDetails Details;
			if (ParseShowroomJson(Resp->GetContentAsString(), Details))
			{
				OnGetShowroomCompleted.Broadcast(Details, TEXT(""));
			}
			else
			{
				OnGetShowroomCompleted.Broadcast(FRV_ShowroomDetails(), TEXT("Parse error"));
			}
		}
		else
		{
			OnGetShowroomCompleted.Broadcast(FRV_ShowroomDetails(), FString::Printf(TEXT("HTTP %d"), Resp->GetResponseCode()));
		}
	});

	Request->SetURL(Url);
	Request->SetVerb(TEXT("GET"));
	Request->SetHeader(TEXT("Accept"), TEXT("application/json"));
	Request->ProcessRequest();
}

static bool JsonTryGetString(const TSharedPtr<FJsonObject>& Obj, const FString& Key, FString& Out)
{
	if (!Obj.IsValid()) return false;
	const TSharedPtr<FJsonValue>* Val = nullptr;
	if (Obj->TryGetField(Key, Val) && Val && (*Val)->Type == EJson::String)
	{
		Out = (*Val)->AsString();
		return true;
	}
	return false;
}

bool URV_ShowroomsSubsystem::ParseShowroomsJson(const FString& Json, TArray<FRV_ShowroomSummary>& OutList) const
{
	TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Json);
	TArray<TSharedPtr<FJsonValue>> Root;
	if (!FJsonSerializer::Deserialize(Reader, Root)) return false;

	for (const TSharedPtr<FJsonValue>& Item : Root)
	{
		TSharedPtr<FJsonObject> Obj = Item->AsObject();
		if (!Obj.IsValid()) continue;

		FRV_ShowroomSummary S;
		JsonTryGetString(Obj, TEXT("id"), S.id);
		JsonTryGetString(Obj, TEXT("name"), S.name);
		JsonTryGetString(Obj, TEXT("slug"), S.slug);
		JsonTryGetString(Obj, TEXT("companyName"), S.companyName);
		JsonTryGetString(Obj, TEXT("shortDescription"), S.shortDescription);
		JsonTryGetString(Obj, TEXT("genre"), S.genre);
		JsonTryGetString(Obj, TEXT("publishingTrack"), S.publishingTrack);
		JsonTryGetString(Obj, TEXT("buildStatus"), S.buildStatus);
		JsonTryGetString(Obj, TEXT("gameLogoUrl"), S.gameLogoUrl);
		JsonTryGetString(Obj, TEXT("coverArtUrl"), S.coverArtUrl);

		OutList.Add(MoveTemp(S));
	}

	return true;
}

bool URV_ShowroomsSubsystem::ParseShowroomJson(const FString& Json, FRV_ShowroomDetails& OutDetails) const
{
	TSharedPtr<FJsonObject> Obj;
	TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Json);
	if (!FJsonSerializer::Deserialize(Reader, Obj) || !Obj.IsValid()) return false;

	FRV_ShowroomSummary& Base = OutDetails;
	JsonTryGetString(Obj, TEXT("id"), Base.id);
	JsonTryGetString(Obj, TEXT("name"), Base.name);
	JsonTryGetString(Obj, TEXT("slug"), Base.slug);
	JsonTryGetString(Obj, TEXT("companyName"), Base.companyName);
	JsonTryGetString(Obj, TEXT("shortDescription"), Base.shortDescription);
	JsonTryGetString(Obj, TEXT("genre"), Base.genre);
	JsonTryGetString(Obj, TEXT("publishingTrack"), Base.publishingTrack);
	JsonTryGetString(Obj, TEXT("buildStatus"), Base.buildStatus);
	JsonTryGetString(Obj, TEXT("gameLogoUrl"), Base.gameLogoUrl);
	JsonTryGetString(Obj, TEXT("coverArtUrl"), Base.coverArtUrl);

	JsonTryGetString(Obj, TEXT("trailerUrl"), OutDetails.trailerUrl);
	JsonTryGetString(Obj, TEXT("gameUrl"), OutDetails.gameUrl);
	JsonTryGetString(Obj, TEXT("launcherUrl"), OutDetails.launcherUrl);

	// Arrays
	const TArray<TSharedPtr<FJsonValue>>* ScreensArr = nullptr;
	if (Obj->TryGetArrayField(TEXT("screenshotUrls"), ScreensArr) && ScreensArr)
	{
		for (const auto& V : *ScreensArr) { OutDetails.screenshotUrls.Add(V->AsString()); }
	}
	const TArray<TSharedPtr<FJsonValue>>* PlatformsArr = nullptr;
	if (Obj->TryGetArrayField(TEXT("targetPlatforms"), PlatformsArr) && PlatformsArr)
	{
		for (const auto& V : *PlatformsArr) { OutDetails.targetPlatforms.Add(V->AsString()); }
	}

	// Timestamps (ISO8601)
	FString Created, Updated;
	if (JsonTryGetString(Obj, TEXT("createdAt"), Created)) { FDateTime::ParseIso8601(*Created, OutDetails.createdAt); }
	if (JsonTryGetString(Obj, TEXT("updatedAt"), Updated)) { FDateTime::ParseIso8601(*Updated, OutDetails.updatedAt); }

	return true;
}


