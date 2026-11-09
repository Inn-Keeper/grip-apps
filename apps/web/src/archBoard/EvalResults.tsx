import { useEffect, useRef } from "react";
import type { evaluate } from "@grip/core/arch";
import { t } from "@grip/core/i18n";
import { BrandIcon } from "../components/BrandIcon";
import { colors } from "../lib/tokens";
import { scrollBehavior } from "../lib/motion";
import styles from "./EvalResults.module.css";

type Check = ReturnType<typeof evaluate>["checks"][number];
type Result = Pick<ReturnType<typeof evaluate>, "score" | "checks" | "warnings">;
type Change = { scoreChange: number; gained: string[]; lost: string[] };

export function EvalResults({ result, pushback = [], showScore = true, change = null, onInspect }: {
  result: Result;
  pushback?: string[];
  showScore?: boolean;
  change?: Change | null;
  onInspect?: (check: Check) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
  }, [result]);
  const missing = result.checks.filter((check) => !check.passed).sort((a, b) => b.points - a.points);
  const passed = result.checks.filter((check) => check.passed);
  return (
    <section ref={ref} className={styles.results} aria-label={t("board.eval.title")}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>{t("board.eval.title")}</p>
          <h2>{t(missing.length ? "board.eval.partial" : "board.eval.complete")}</h2>
        </div>
        {showScore && <strong className={styles.score}>{result.score}% <span>{t("board.eval.coverage")}</span></strong>}
      </header>
      <div role="status" className={styles.summary}>
        <p>{t("board.eval.summary", { passed: passed.length, total: result.checks.length, earned: passed.reduce((sum, check) => sum + check.points, 0), points: result.checks.reduce((sum, check) => sum + check.points, 0) })}</p>
        {change && <p className={styles.change}>{t("board.eval.change", { points: `${change.scoreChange > 0 ? "+" : ""}${change.scoreChange}`, gained: change.gained.length, lost: change.lost.length })}</p>}
      </div>
      <div className={styles.columns}>
        <section>
          {missing.length > 0 && <>
            <h3>{t("board.eval.missing", { count: missing.length })}</h3>
            {onInspect && <p className={styles.hint}>{t("board.eval.locateHint")}</p>}
            <ul className={styles.checks}>
              {missing.map((check) => <CheckRow key={check.label} check={check} onInspect={onInspect} changed={change?.lost.includes(check.label) ?? false} />)}
            </ul>
          </>}
          {passed.length > 0 && <details className={styles.passed} open={missing.length === 0 || !!change?.gained.length}>
            <summary>{t("board.eval.done", { count: passed.length })}</summary>
            <ul className={styles.checks}>
              {passed.map((check) => <CheckRow key={check.label} check={check} onInspect={onInspect} changed={change?.gained.includes(check.label) ?? false} />)}
            </ul>
          </details>}
        </section>
        {result.warnings.length > 0 && <section>
          <h3>{t("board.eval.warnings", { count: result.warnings.length })}</h3>
          <ul className={styles.warnings}>
            {result.warnings.map((warning) => <li key={warning}><BrandIcon name="warning" size={15} color={colors.warningBright} /><span>{warning}</span></li>)}
          </ul>
        </section>}
      </div>
      {pushback.length > 0 && <details className={styles.followups} open>
        <summary>{t("board.pushback")}</summary>
        <p className={styles.hint}>{t("board.pushbackHint")}</p>
        <ol>{pushback.map((question) => <li key={question}>{question}</li>)}</ol>
      </details>}
    </section>
  );
}

function CheckRow({ check, onInspect, changed }: { check: Check; onInspect?: (check: Check) => void; changed: boolean }) {
  const content = <>
    <BrandIcon name={check.passed ? "check" : "board"} size={16} color={check.passed ? colors.successBright : colors.textDim} />
    <span className={styles.checkLabel}>{check.label}</span>
    <span className={styles.points}>{t(check.passed ? "board.eval.earnedPoints" : "board.eval.openPoints", { points: check.points })}</span>
    {onInspect && <span className={styles.locate}>{t("board.eval.locate")}</span>}
  </>;
  return <li className={styles.check} data-passed={check.passed} data-changed={changed || undefined}>
    {onInspect ? <button type="button" className={styles.checkBody} onClick={() => onInspect(check)}>{content}</button> : <div className={styles.checkBody}>{content}</div>}
  </li>;
}
