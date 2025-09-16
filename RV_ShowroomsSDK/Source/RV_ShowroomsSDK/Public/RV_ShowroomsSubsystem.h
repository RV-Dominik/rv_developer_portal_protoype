#pragma once

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "Models/RV_ShowroomModels.h"

#include "RV_ShowroomsSubsystem.generated.h"

DECLARE_DYNAMIC_DELEGATE_ThreeParams(FRV_ShowroomsListResult, const bool, bSuccess, const TArray<FRV_ShowroomSummary>&, Showrooms, const FString&, Error);
DECLARE_DYNAMIC_DELEGATE_ThreeParams(FRV_ShowroomDetailsResult, const bool, bSuccess, const FRV_ShowroomDetails&, Showroom, const FString&, Error);
DECLARE_DYNAMIC_DELEGATE_TwoParams(FRV_DeepLinkResult, const bool, bSuccess, const FString&, Error);

UCLASS(BlueprintType)
class URV_ShowroomsSubsystem : public UGameInstanceSubsystem
{
	GENERATED_BODY()

public:
	// Base URL for the backend, e.g. https://rv-developer-portal-prototype.onrender.com
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Readyverse|Config")
	FString ApiBaseUrl = "https://rv-developer-portal-protoype.onrender.com";

	// Auto-register deep link protocol on startup
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Readyverse|Config")
	bool bAutoRegisterDeepLink = true;

	virtual void Initialize(FSubsystemCollectionBase& Collection) override;

	UFUNCTION(BlueprintCallable, Category="Readyverse|Showroom")
	void ListShowrooms(const FRV_ShowroomsListResult& OnComplete);

	UFUNCTION(BlueprintCallable, Category="Readyverse|Showroom")
	void GetShowroomById(const FString& ShowroomId, const FRV_ShowroomDetailsResult& OnComplete);

	UFUNCTION(BlueprintCallable, Category="Readyverse|Showroom")
	void LoadShowroom(const FString& ShowroomId);

	// Deep Link Handling
	UFUNCTION(BlueprintCallable, Category="Readyverse|DeepLink")
	void HandleDeepLink(const FString& DeepLinkUrl, const FRV_DeepLinkResult& OnComplete);

	UFUNCTION(BlueprintCallable, Category="Readyverse|DeepLink")
	void OpenShowroomFromDeepLink(const FString& ProjectId);

	UFUNCTION(BlueprintCallable, Category="Readyverse|DeepLink")
	void OpenShowroomFromDeepLinkWithData(const FString& ShowroomJson);

	// Deep Link Events
	DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FRV_OnDeepLinkReceived, const FString&, DeepLinkUrl);
	UPROPERTY(BlueprintAssignable, Category="Readyverse|DeepLink")
	FRV_OnDeepLinkReceived OnDeepLinkReceived;

	// Showroom Load Events
	DECLARE_DYNAMIC_MULTICAST_DELEGATE_ThreeParams(FRV_OnShowroomLoaded, const bool, bSuccess, const FRV_ShowroomDetails&, Showroom, const FString&, Error);
	UPROPERTY(BlueprintAssignable, Category="Readyverse|Showroom")
	FRV_OnShowroomLoaded OnShowroomLoaded;

	// Protocol Registration
	UFUNCTION(BlueprintCallable, Category="Readyverse|DeepLink")
	bool RegisterDeepLinkProtocol();

	UFUNCTION(BlueprintCallable, Category="Readyverse|DeepLink")
	bool UnregisterDeepLinkProtocol();

	UFUNCTION(BlueprintCallable, Category="Readyverse|DeepLink")
	bool IsDeepLinkProtocolRegistered();

private:
	bool EnsureApiUrl();
	bool ParseShowroomsJson(const FString& Json, TArray<FRV_ShowroomSummary>& OutList) const;
	bool ParseShowroomJson(const FString& Json, FRV_ShowroomDetails& OutDetails) const;
	FLinearColor HexStringToLinearColor(const FString& HexString) const;

	// Deep link parameters storage
	FString PendingDeepLinkShowroomId;
	FString PendingDeepLinkShowroomJson;
};


