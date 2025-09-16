#include "RV_ShowroomsSubsystem.h"

#include "HttpModule.h"
#include "Interfaces/IHttpResponse.h"
#include "Json.h"
#include "JsonObjectConverter.h"
#include "Engine/Engine.h"
#include "Misc/CommandLine.h"
#include "Misc/Parse.h"
#include "HAL/PlatformProcess.h"
#include "Misc/Paths.h"
#include "Misc/FileHelper.h"

void URV_ShowroomsSubsystem::Initialize(FSubsystemCollectionBase& Collection)
{
	Super::Initialize(Collection);
	
	// Automatically register deep link protocol on startup if enabled
	if (bAutoRegisterDeepLink)
	{
		UE_LOG(LogTemp, Log, TEXT("Auto-registering deep link protocol on startup"));
		RegisterDeepLinkProtocol();
	}
	else
	{
		UE_LOG(LogTemp, Log, TEXT("Deep link auto-registration is disabled"));
	}
	
	// Check for deep link parameters on startup
	FString CommandLine = FCommandLine::Get();
	if (CommandLine.Contains(TEXT("rvshowroom://")))
	{
		// Extract deep link URL from command line
		FString DeepLinkUrl;
		if (FParse::Value(*CommandLine, TEXT("rvshowroom://"), DeepLinkUrl))
		{
			DeepLinkUrl = TEXT("rvshowroom://") + DeepLinkUrl;
			HandleDeepLink(DeepLinkUrl, FRV_DeepLinkResult::CreateLambda([](bool bSuccess, const FString& Error)
			{
				if (bSuccess)
				{
					UE_LOG(LogTemp, Log, TEXT("Deep link handled successfully"));
				}
				else
				{
					UE_LOG(LogTemp, Warning, TEXT("Deep link failed: %s"), *Error);
				}
			}));
		}
	}
}

void URV_ShowroomsSubsystem::ListShowrooms(const FRV_ShowroomsListResult& OnComplete)
{
	if (!EnsureApiUrl()) { OnComplete.ExecuteIfBound(false,{}, TEXT("Missing ApiBaseUrl")); return; }

	const FString Url = ApiBaseUrl.TrimEnd() + TEXT("/api/showroom/games");

	TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Request = FHttpModule::Get().CreateRequest();
	Request->OnProcessRequestComplete().BindLambda([this, OnComplete](FHttpRequestPtr Req, FHttpResponsePtr Resp, bool bOk)
	{
		if (!bOk || !Resp.IsValid())
		{
			OnComplete.ExecuteIfBound(false,{}, TEXT("Network error"));
			return;
		}

		if (Resp->GetResponseCode() >= 200 && Resp->GetResponseCode() < 300)
		{
			TArray<FRV_ShowroomSummary> Out;
			if (ParseShowroomsJson(Resp->GetContentAsString(), Out))
			{
				OnComplete.ExecuteIfBound(true, Out, TEXT(""));
			}
			else
			{
				OnComplete.ExecuteIfBound(false,{}, TEXT("Parse error"));
			}
		}
		else
		{
			OnComplete.ExecuteIfBound(false,{}, FString::Printf(TEXT("HTTP %d"), Resp->GetResponseCode()));
		}
	});

	Request->SetURL(Url);
	Request->SetVerb(TEXT("GET"));
	Request->SetHeader(TEXT("Accept"), TEXT("application/json"));
	Request->ProcessRequest();
}

void URV_ShowroomsSubsystem::GetShowroomById(const FString& ShowroomId, const FRV_ShowroomDetailsResult& OnComplete)
{
	if (!EnsureApiUrl()) { OnComplete.ExecuteIfBound(false, FRV_ShowroomDetails(), TEXT("Missing ApiBaseUrl")); return; }

	const FString Url = ApiBaseUrl.TrimEnd() + TEXT("/api/showroom/games/") + ShowroomId;

	TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Request = FHttpModule::Get().CreateRequest();
	Request->OnProcessRequestComplete().BindLambda([this, OnComplete](FHttpRequestPtr Req, FHttpResponsePtr Resp, bool bOk)
	{
		if (!bOk || !Resp.IsValid())
		{
			OnComplete.ExecuteIfBound(false,FRV_ShowroomDetails(), TEXT("Network error"));
			return;
		}

		if (Resp->GetResponseCode() >= 200 && Resp->GetResponseCode() < 300)
		{
			FRV_ShowroomDetails Details;
			if (ParseShowroomJson(Resp->GetContentAsString(), Details))
			{
				OnComplete.ExecuteIfBound(true,Details, TEXT(""));
			}
			else
			{
				OnComplete.ExecuteIfBound(false, FRV_ShowroomDetails(), TEXT("Parse error"));
			}
		}
		else
		{
			OnComplete.ExecuteIfBound(false, FRV_ShowroomDetails(), FString::Printf(TEXT("HTTP %d"), Resp->GetResponseCode()));
		}
	});

	Request->SetURL(Url);
	Request->SetVerb(TEXT("GET"));
	Request->SetHeader(TEXT("Accept"), TEXT("application/json"));
	Request->ProcessRequest();
}

void URV_ShowroomsSubsystem::LoadShowroom(const FString& ShowroomId)
{
	UE_LOG(LogTemp, Log, TEXT("Loading showroom: %s"), *ShowroomId);
	
	// Use the existing GetShowroomById function but with multicast delegate
	GetShowroomById(ShowroomId, FRV_ShowroomDetailsResult::CreateLambda([this](bool bSuccess, const FRV_ShowroomDetails& Showroom, const FString& Error)
	{
		// Broadcast the multicast delegate
		OnShowroomLoaded.Broadcast(bSuccess, Showroom, Error);
		
		if (bSuccess)
		{
			UE_LOG(LogTemp, Log, TEXT("Showroom loaded successfully: %s"), *Showroom.name);
			
			// If we have pending deep link data, log it for use by other systems
			if (!PendingDeepLinkShowroomId.IsEmpty())
			{
				UE_LOG(LogTemp, Log, TEXT("Deep link showroom ID: %s"), *PendingDeepLinkShowroomId);
				PendingDeepLinkShowroomId.Empty();
			}
			else if (!PendingDeepLinkShowroomJson.IsEmpty())
			{
				UE_LOG(LogTemp, Log, TEXT("Deep link showroom data was pre-loaded"));
				PendingDeepLinkShowroomJson.Empty();
			}
		}
		else
		{
			UE_LOG(LogTemp, Error, TEXT("Failed to load showroom: %s"), *Error);
		}
	}));
}

static bool JsonTryGetString(const TSharedPtr<FJsonObject>& Obj, const FString& Key, FString& Out)
{
	if (!Obj.IsValid()) return false;
	const TSharedPtr<FJsonValue> Val = Obj->TryGetField(Key);
	if (Val.IsValid() && Val->Type == EJson::String)
	{
		Out = Val->AsString();
		return true;
	}
	return false;
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

FLinearColor URV_ShowroomsSubsystem::HexStringToLinearColor(const FString& HexString) const
{
	FString CleanHex = HexString.TrimStartAndEnd();
	
	// Remove # if present
	if (CleanHex.StartsWith(TEXT("#")))
	{
		CleanHex = CleanHex.Mid(1);
	}
	
	// Ensure we have a valid hex string
	if (CleanHex.Len() != 6)
	{
		UE_LOG(LogTemp, Warning, TEXT("Invalid hex color string: %s, using default color"), *HexString);
		return FLinearColor::White;
	}
	
	// Parse hex values
	uint32 HexValue = 0;
	if (!FParse::HexNumber(*CleanHex, HexValue))
	{
		UE_LOG(LogTemp, Warning, TEXT("Failed to parse hex color: %s, using default color"), *HexString);
		return FLinearColor::White;
	}
	
	// Extract RGB components (hex is in RRGGBB format)
	uint8 R = (HexValue >> 16) & 0xFF;
	uint8 G = (HexValue >> 8) & 0xFF;
	uint8 B = HexValue & 0xFF;
	
	// Convert to linear color (0-255 range to 0.0-1.0 range)
	return FLinearColor(R / 255.0f, G / 255.0f, B / 255.0f, 1.0f);
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
		JsonTryGetString(Obj, TEXT("showroomTier"), S.showroomTier);
		JsonTryGetString(Obj, TEXT("showroomLightingColor"), S.showroomLightingColor);
		
		// Convert hex color string to FLinearColor
		S.showroomLightingColorLinear = HexStringToLinearColor(S.showroomLightingColor);

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
	JsonTryGetString(Obj, TEXT("showroomTier"), Base.showroomTier);
	JsonTryGetString(Obj, TEXT("showroomLightingColor"), Base.showroomLightingColor);
	
	// Convert hex color string to FLinearColor
	Base.showroomLightingColorLinear = HexStringToLinearColor(Base.showroomLightingColor);

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

void URV_ShowroomsSubsystem::HandleDeepLink(const FString& DeepLinkUrl, const FRV_DeepLinkResult& OnComplete)
{
	UE_LOG(LogTemp, Log, TEXT("Handling deep link: %s"), *DeepLinkUrl);
	
	// Broadcast the deep link event
	OnDeepLinkReceived.Broadcast(DeepLinkUrl);
	
	// Parse the deep link URL
	FString UrlPath;
	if (DeepLinkUrl.StartsWith(TEXT("rvshowroom://open")))
	{
		// Extract query parameters
		FString QueryString;
		if (DeepLinkUrl.Contains(TEXT("?")))
		{
			DeepLinkUrl.Split(TEXT("?"), nullptr, &QueryString);
		}
		
		if (QueryString.IsEmpty())
		{
			OnComplete.ExecuteIfBound(false, TEXT("No parameters found in deep link"));
			return;
		}
		
		// Parse parameters
		TMap<FString, FString> Parameters;
		TArray<FString> ParamPairs;
		QueryString.ParseIntoArray(ParamPairs, TEXT("&"), true);
		
		for (const FString& Pair : ParamPairs)
		{
			FString Key, Value;
			if (Pair.Split(TEXT("="), &Key, &Value))
			{
				Parameters.Add(Key, Value);
			}
		}
		
		// Extract required parameters
		FString ProjectId = Parameters.FindRef(TEXT("projectId"));
		FString Action = Parameters.FindRef(TEXT("action"));
		FString ShowroomJson = Parameters.FindRef(TEXT("showroomData"));
		
		if (ProjectId.IsEmpty() && ShowroomJson.IsEmpty())
		{
			OnComplete.ExecuteIfBound(false, TEXT("Missing projectId or showroomData parameter"));
			return;
		}
		
		if (Action == TEXT("open_showroom"))
		{
			if (!ShowroomJson.IsEmpty())
			{
				// Decode URL-encoded JSON data
				ShowroomJson = FGenericPlatformHttp::UrlDecode(ShowroomJson);
				
				// Open showroom with pre-loaded data (skip server call)
				OpenShowroomFromDeepLinkWithData(ShowroomJson);
				OnComplete.ExecuteIfBound(true, TEXT("Showroom opened with pre-loaded data"));
			}
			else
			{
				// Open showroom with ID (load from server)
				OpenShowroomFromDeepLink(ProjectId);
				OnComplete.ExecuteIfBound(true, TEXT("Showroom opened with ID"));
			}
		}
		else
		{
			OnComplete.ExecuteIfBound(false, FString::Printf(TEXT("Unknown action: %s"), *Action));
		}
	}
	else
	{
		OnComplete.ExecuteIfBound(false, TEXT("Invalid deep link format"));
	}
}

void URV_ShowroomsSubsystem::OpenShowroomFromDeepLink(const FString& ProjectId)
{
	UE_LOG(LogTemp, Log, TEXT("Opening showroom from deep link with ID: %s"), *ProjectId);
	
	// Store showroom ID for loading from server
	PendingDeepLinkShowroomId = ProjectId;
	PendingDeepLinkShowroomJson.Empty();
	
	// Load the showroom from server - this will trigger the OnShowroomLoaded multicast delegate
	LoadShowroom(ProjectId);
	
	// Show immediate feedback
	if (GEngine)
	{
		FString Message = FString::Printf(TEXT("Loading showroom from server: %s"), *ProjectId);
		UE_LOG(LogTemp, Log, TEXT("%s"), *Message);
	}
}

void URV_ShowroomsSubsystem::OpenShowroomFromDeepLinkWithData(const FString& ShowroomJson)
{
	UE_LOG(LogTemp, Log, TEXT("Opening showroom from deep link with pre-loaded data"));
	
	// Store showroom JSON data
	PendingDeepLinkShowroomJson = ShowroomJson;
	PendingDeepLinkShowroomId.Empty();
	
	// Parse the JSON and broadcast the multicast delegate immediately
	TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(ShowroomJson);
	TSharedPtr<FJsonObject> JsonObject;
	
	if (FJsonSerializer::Deserialize(Reader, JsonObject) && JsonObject.IsValid())
	{
		// Parse the showroom data
		FRV_ShowroomDetails ShowroomDetails;
		if (ParseShowroomJson(ShowroomJson, ShowroomDetails))
		{
			UE_LOG(LogTemp, Log, TEXT("Showroom data parsed successfully: %s"), *ShowroomDetails.name);
			
			// Broadcast the multicast delegate immediately (no server call needed)
			OnShowroomLoaded.Broadcast(true, ShowroomDetails, TEXT(""));
		}
		else
		{
			UE_LOG(LogTemp, Error, TEXT("Failed to parse showroom JSON data"));
			OnShowroomLoaded.Broadcast(false, FRV_ShowroomDetails(), TEXT("Failed to parse showroom data"));
		}
	}
	else
	{
		UE_LOG(LogTemp, Error, TEXT("Failed to deserialize showroom JSON"));
		OnShowroomLoaded.Broadcast(false, FRV_ShowroomDetails(), TEXT("Invalid JSON format"));
	}
}


