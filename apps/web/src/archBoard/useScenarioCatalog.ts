import { useMemo } from "react";
import { buildScenarioCatalog } from "@grip/core/scenarioCatalog";
import { useCustomScenariosQuery } from "./queries";
import type { AugmentedScenario } from "./types";

// Built-in plus the user's custom scenarios, and the grouped picker options for them.
export function useScenarioCatalog() {
  const { data: customScenarios = [], error, isFetching } = useCustomScenariosQuery();
  const { allScenarios, groups: scenarioOptions } = useMemo(() => buildScenarioCatalog(customScenarios), [customScenarios]);
  return { allScenarios: allScenarios as AugmentedScenario[], scenarioOptions, error, isFetching };
}
