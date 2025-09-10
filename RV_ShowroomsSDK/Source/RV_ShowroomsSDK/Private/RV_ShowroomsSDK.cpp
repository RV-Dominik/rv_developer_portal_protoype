#include "RV_ShowroomsSDK.h"
#include "Modules/ModuleManager.h"

class FRV_ShowroomsSDKModule : public IModuleInterface
{
public:
	virtual void StartupModule() override {}
	virtual void ShutdownModule() override {}
};

IMPLEMENT_MODULE(FRV_ShowroomsSDKModule, RV_ShowroomsSDK)


