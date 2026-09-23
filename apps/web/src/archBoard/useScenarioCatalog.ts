import { useMemo } from "react";
import { SCENARIOS, SCENARIO_CATEGORIES } from "@grip/core/arch";
import { CUSTOM_CATEGORY } from "./constants";
import { useCustomScenariosQuery } from "./queries";
import type { AugmentedScenario } from "./types";

// Built-in plus the user's custom scenarios, and the grouped picker options for them.
export function useScenarioCatalog() {
  const { data: customScenarios = [], error, isFetching } = useCustomScenariosQuery();
  const allScenarios: AugmentedScenario[] = useMemo(() => [
    ...(SCENARIOS as AugmentedScenario[]),
    ...customScenarios.map((s) => ({ ...s, category: CUSTOM_CATEGORY, custom: true })),
  ], [customScenarios]);
  const scenarioOptions = useMemo(() => [...SCENARIO_CATEGORIES, CUSTOM_CATEGORY]
    .map((category) => ({
      label: category,
      options: allScenarios
        .filter((s) => s.category === category)
        .map((s) => ({ value: s.id, label: s.name })),
    }))
    .filter((group) => group.options.length > 0), [allScenarios]);
  return { allScenarios, scenarioOptions, error, isFetching };
}
