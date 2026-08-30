# Learning to Prioritize Content Refresh Opportunities Using Search Performance Signals

**Author:** Subhrakanta Mohapatra  
**Date:** August 2026  
**Track:** FlyRank ML Internship — Machine Learning

## Abstract
This study asks whether historical search-performance and content signals can help identify pages likely to experience near-term traffic decline. The bundled anonymized starter dataset contains 30,000 content rows. The target is `is_declining_label = trend_direction == "down"`; trend fields are excluded from the feature matrix to prevent leakage. Logistic regression, decision tree, and random forest models are compared with a transparent baseline using client-holdout validation. The random forest reaches **0.750 ROC AUC** and **0.740 Precision@50** on the holdout and produces a ranked refresh queue for human review.

## Key Results
- Rows scored: **30,000**
- Positive/declining label rate: **54.2%** (16,262 rows)
- Best model: **Random Forest**
- ROC AUC: **0.750**
- Average precision: **0.618**
- Precision@50: **0.740**
- Recall: **0.744**
- Baseline ROC AUC: **0.627**
- Baseline Precision@50: **0.240**

## Problem & Decision
The unit of analysis is a content page. The output is a ranked 0–100 priority score and action recommendation. Editors use the queue to decide which pages to review first. False positives consume editorial capacity; false negatives can leave declining pages unattended.

## Data Safety
The raw starter slice is 30,000 rows × 44 columns across 32 pseudonymized clients. `content_id` and `client_id` are grouping identifiers only. `trend_direction` and `trend_pct` are excluded because the label is derived from `trend_direction`. Private client names, domains, exact URLs, and raw queries are not part of the public artifact.

## Methodology
Candidate models: logistic regression, decision tree, and random forest. The random forest is selected by Precision@50 because the intended use case is a limited-capacity review queue. The model uses 52 engineered features spanning numeric performance/content signals and categorical metadata.

## Validation
Validation uses a client-holdout split so complete client groups remain in either train or test. The run records 27,675 training rows and 2,325 test rows. Random seed: 42.

## Interpretation
The leading feature importances are `days_with_impressions`, `log_impressions_90d`, `avg_position`, and `content_age_days`. Word count contributes, but is lower than the leading exposure and age signals. These are predictive associations, not causal effects.

## Action Playbook
The final queue contains actions such as `refresh`, `refresh_and_review_ctr`, `refresh_and_review_engagement`, `expand_and_refresh`, and `monitor`. High-confidence rows are intended for manual inspection first.

## Limitations
This is a predictive decision-support model, not a causal model. It does not diagnose root cause, should not be assumed valid for new content, and should not automatically delete, redirect, rewrite, or publish content. Results are specific to the 30,000-row starter slice and are not a benchmark for the full roughly 79M-row daily warehouse.

## Reproducibility
Run the complete pipeline from the repository root with:

```bash
python scripts/run_all.py
```

Outputs include `outputs/model_results.json`, `outputs/summary.json`, `outputs/refresh_queue.csv`, and model charts under `outputs/charts/`.

## Data Credit
Built on the FlyRank ML Internship dataset.
