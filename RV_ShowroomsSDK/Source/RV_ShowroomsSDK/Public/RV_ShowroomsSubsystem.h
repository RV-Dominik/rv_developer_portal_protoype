#pragma once

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "Models/RV_ShowroomModels.h"

#include "RV_ShowroomsSubsystem.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FRV_ShowroomsListResult, const TArray<FRV_ShowroomSummary>&, Showrooms, const FString&, Error);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FRV_ShowroomDetailsResult, const FRV_ShowroomDetails&, Showroom, const FString&, Error);

UCLASS(BlueprintType)
class URV_ShowroomsSubsystem : public UGameInstanceSubsystem
{
	GENERATED_BODY()

public:
	// Base URL for the backend, e.g. https://rv-developer-portal-prototype.onrender.com
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Readyverse|Config")
	FString ApiBaseUrl;

	virtual void Initialize(FSubsystemCollectionBase& Collection) override;

	UFUNCTION(BlueprintCallable, Category="Readyverse|Showroom")
	void ListShowrooms();

	UFUNCTION(BlueprintCallable, Category="Readyverse|Showroom")
	void GetShowroomById(const FString& ShowroomId);

	UPROPERTY(BlueprintAssignable)
	FRV_ShowroomsListResult OnListShowroomsCompleted;

	UPROPERTY(BlueprintAssignable)
	FRV_ShowroomDetailsResult OnGetShowroomCompleted;

private:
	bool EnsureApiUrl();
	bool ParseShowroomsJson(const FString& Json, TArray<FRV_ShowroomSummary>& OutList) const;
	bool ParseShowroomJson(const FString& Json, FRV_ShowroomDetails& OutDetails) const;
};


