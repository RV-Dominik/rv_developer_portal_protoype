#pragma once

#include "CoreMinimal.h"

#include "RV_ShowroomModels.generated.h"

USTRUCT(BlueprintType)
struct FRV_ShowroomSummary
{
	GENERATED_BODY()

	UPROPERTY(BlueprintReadOnly, Category="Readyverse|Showroom")
	FString id;

	UPROPERTY(BlueprintReadOnly, Category="Readyverse|Showroom")
	FString name;

	UPROPERTY(BlueprintReadOnly, Category="Readyverse|Showroom")
	FString slug;

	UPROPERTY(BlueprintReadOnly, Category="Readyverse|Showroom")
	FString companyName;

	UPROPERTY(BlueprintReadOnly, Category="Readyverse|Showroom")
	FString shortDescription;

	UPROPERTY(BlueprintReadOnly, Category="Readyverse|Showroom")
	FString genre;

	UPROPERTY(BlueprintReadOnly, Category="Readyverse|Showroom")
	FString publishingTrack;

	UPROPERTY(BlueprintReadOnly, Category="Readyverse|Showroom")
	FString buildStatus;

	UPROPERTY(BlueprintReadOnly, Category="Readyverse|Showroom")
	FString gameLogoUrl;

	UPROPERTY(BlueprintReadOnly, Category="Readyverse|Showroom")
	FString coverArtUrl;

	UPROPERTY(BlueprintReadOnly, Category="Readyverse|Showroom")
	FString showroomTier;

	UPROPERTY(BlueprintReadOnly, Category="Readyverse|Showroom")
	FString showroomLightingColor;

	UPROPERTY(BlueprintReadOnly, Category="Readyverse|Showroom")
	FLinearColor showroomLightingColorLinear;
};

USTRUCT(BlueprintType)
struct FRV_ShowroomDetails : public FRV_ShowroomSummary
{
	GENERATED_BODY()

	UPROPERTY(BlueprintReadOnly, Category="Readyverse|Showroom")
	FString trailerUrl;

	UPROPERTY(BlueprintReadOnly, Category="Readyverse|Showroom")
	TArray<FString> screenshotUrls;

	UPROPERTY(BlueprintReadOnly, Category="Readyverse|Showroom")
	FString gameUrl;

	UPROPERTY(BlueprintReadOnly, Category="Readyverse|Showroom")
	FString launcherUrl;

	UPROPERTY(BlueprintReadOnly, Category="Readyverse|Showroom")
	TArray<FString> targetPlatforms;

	UPROPERTY(BlueprintReadOnly, Category="Readyverse|Showroom")
	FDateTime createdAt;

	UPROPERTY(BlueprintReadOnly, Category="Readyverse|Showroom")
	FDateTime updatedAt;
};


