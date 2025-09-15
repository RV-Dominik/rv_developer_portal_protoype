#pragma once

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "Models/RV_ShowroomModels.h"

#include "RV_ShowroomsSubsystem.generated.h"

DECLARE_DYNAMIC_DELEGATE_ThreeParams(FRV_ShowroomsListResult, const bool, bSuccess, const TArray<FRV_ShowroomSummary>&, Showrooms, const FString&, Error);
DECLARE_DYNAMIC_DELEGATE_ThreeParams(FRV_ShowroomDetailsResult, const bool, bSuccess, const FRV_ShowroomDetails&, Showroom, const FString&, Error);

UCLASS(BlueprintType)
class URV_ShowroomsSubsystem : public UGameInstanceSubsystem
{
	GENERATED_BODY()

public:
	// Base URL for the backend, e.g. https://rv-developer-portal-prototype.onrender.com
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Readyverse|Config")
	FString ApiBaseUrl = "https://rv-developer-portal-protoype.onrender.com";

	virtual void Initialize(FSubsystemCollectionBase& Collection) override;

	UFUNCTION(BlueprintCallable, Category="Readyverse|Showroom")
	void ListShowrooms(const FRV_ShowroomsListResult& OnComplete);

	UFUNCTION(BlueprintCallable, Category="Readyverse|Showroom")
	void GetShowroomById(const FString& ShowroomId, const FRV_ShowroomDetailsResult& OnComplete);



private:
	bool EnsureApiUrl();
	bool ParseShowroomsJson(const FString& Json, TArray<FRV_ShowroomSummary>& OutList) const;
	bool ParseShowroomJson(const FString& Json, FRV_ShowroomDetails& OutDetails) const;
};


