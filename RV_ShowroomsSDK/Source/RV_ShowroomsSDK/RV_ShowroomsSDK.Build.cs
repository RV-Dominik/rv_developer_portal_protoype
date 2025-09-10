using UnrealBuildTool;

public class RV_ShowroomsSDK : ModuleRules
{
	public RV_ShowroomsSDK(ReadOnlyTargetRules Target) : base(Target)
	{
		PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;

		PublicDependencyModuleNames.AddRange(new string[]
		{
			"Core",
			"HTTP",
			"Json",
			"JsonUtilities",
			"Engine"
		});

		PrivateDependencyModuleNames.AddRange(new string[]
		{
			"CoreUObject"
		});
	}
}


