# Capstone Report — Content Refresh Opportunity Prediction

- **Author:** Subhrakanta Mohapatra
- **Lane:** Content Refresh Opportunities Using Search Performance Signals
- **Repo:** https://github.com/Pravu-19/flyrank-internship-ml
- **Date:** August 2026

## 0. Abstract

This study asks whether historical search-performance and content signals can identify existing pages that should be prioritized for refresh review. The analysis uses the bundled anonymized FlyRank starter dataset containing 30,000 content-page rows across pseudonymized clients. The target is `is_declining_label = trend_direction == "down"`, while label-derived trend fields and grouping identifiers are excluded from the model feature matrix. Logistic regression, decision tree, and random forest models are compared with a transparent ranked baseline using a client-level holdout and fixed random seed 42. On the committed model run, the random forest achieved 0.750 ROC AUC and 0.740 Precision@50 versus 0.627 ROC AUC and 0.240 Precision@50 for the baseline. The output is a ranked refresh-review queue intended to help editors inspect higher-priority pages first; it is decision support, not an automatic publishing or SEO-action system.

## 1. Problem framing

### Decision supported

The decision is **which existing content pages should receive editorial review first** when review capacity is limited.

### Unit of analysis

The unit of analysis is an individual **content page**.

### Output

The pipeline produces:

- a model probability / risk score for decline;
- a ranked review queue;
- confidence categories;
- reason codes;
- a suggested editorial action.

The repository's generated report records 3,605 high-confidence items, 11,395 medium-confidence items, and 15,000 low-confidence items. It also records 8,178 `refresh`, 6,657 `refresh_and_review_ctr`, 1,990 `refresh_and_review_engagement`, 82 `expand_and_refresh`, and 13,093 `monitor` actions.

### Human action

An editor can use the queue to select pages for manual inspection, verify the page and search context, and decide whether to refresh, investigate CTR/engagement, expand the content, or monitor it.

### Cost of a wrong call

- **False positive:** editorial capacity is spent reviewing a page that does not need immediate attention.
- **False negative:** a page showing decline risk may remain unattended.

The model therefore supports prioritization rather than automatic content changes.

### Why ML helps

A transparent rule can combine a small number of obvious signals, but a learned model can combine multiple performance, age, content, and categorical signals and rank pages for a limited-capacity review queue. The model is useful only if it discriminates better than the transparent baseline on the same holdout.

## 2. Data safety

The repository uses the bundled anonymized starter dataset with **30,000 rows and 44 source columns**. The public repository does not use titles, URLs, client names, domains, or raw keywords in the model/report artifacts.

### Deliberately excluded fields

- `trend_direction` — excluded from the feature matrix because the target is derived directly from it.
- `trend_pct` — label-derived trend information and therefore excluded from model features.
- `client_id` — used only to construct the client-level holdout; never used as a model feature.
- `content_id` — used as an identifier for joins/ranking; never used as a model feature.

The preparation script defines `trend_direction` as the source of `is_declining_label`, and the model feature lists omit both trend fields and the pseudonymous IDs.

### Leakage risks considered

The main leakage risk is allowing information that defines the target to enter the feature matrix. The pipeline avoids this by defining the target from `trend_direction` and using a model feature list that excludes `trend_direction` and `trend_pct`.

A second risk is client memorization. `client_id` is used for grouping the holdout so complete client groups remain separated between training and testing, but the identifier is not included in the feature matrix.

### Public-safety statement

No client-identifying names, domains, exact URLs, or raw queries are intentionally included in the research artifact. The work should continue to use observed / measured / directional / decision-support language.

## 3. Baseline

The baseline is a deterministic refresh-priority score designed to be transparent and independently understandable.

It combines four percentile/rank components:

| Component | Weight |
|---|---:|
| Visibility score | 0.40 |
| Freshness-risk score | 0.30 |
| Position-opportunity score | 0.25 |
| Depth-gap score | 0.05 |

The baseline also emits reason codes such as `stale_visible_page`, `declining_with_demand`, `thin_visible_page`, `page_one_decay_risk`, `low_ctr_visible_page`, and `low_engagement_visible_page`.

The comparison is fair because the baseline scores are evaluated on the **same client-holdout test rows** used for the learned models.

### Baseline result

| Metric | Baseline |
|---|---:|
| ROC AUC | 0.627 |
| Average precision | 0.468 |
| Precision@50 | 0.240 |

The baseline is materially weaker than the final random forest on the ranking metric used for the intended limited-capacity review queue.

## 4. Model / analysis

### Target

`is_declining_label = 1` when `trend_direction == "down"`; otherwise `0`.

The prepared data also filters to pages with `impressions_90d > 0` and `content_age_days >= 90`, and removes duplicate `content_id` values.

### Candidate models

The training script evaluates:

1. Logistic regression
2. Decision tree
3. Random forest

The random forest is selected using **Precision@50**, because the intended use case is prioritizing a small review queue.

### Exact model feature list

#### Numeric features

```text
search_volume
competition
cpc
word_count
char_count
log_impressions_90d
log_clicks_90d
log_sessions_90d
log_ai_sessions_90d
days_with_impressions
days_with_sessions
content_age_days
days_since_last_update
ctr
avg_position
engagement_rate
scroll_rate
ai_traffic_pct
```

#### Categorical features

```text
competition_level
content_type
main_intent
age_tier
freshness_tier
word_count_tier
impression_tier
position_tier
```

Categorical variables are one-hot encoded before training.

### Random forest configuration

```text
n_estimators = 200
max_depth = 10
min_samples_leaf = 25
class_weight = balanced_subsample
random_state = 42
n_jobs = -1
```

The selected model therefore uses performance, exposure, position, engagement, content-age, and categorical metadata signals while deliberately excluding label-derived trend fields and pseudonymous IDs.

## 5. Evaluation

### Split

The primary validation strategy is a **client-level holdout**. The training script shuffles unique client IDs with `random_state = 42`, assigns approximately 20% of clients to the test set, and keeps all rows belonging to each client on only one side of the split.

The committed report records:

- **Training rows:** 27,675
- **Test rows:** 2,325
- **Split strategy:** `client_holdout`

This design is preferable to a random row split for this setting because it tests whether the learned relationships transfer to unseen client groups rather than rewarding memorization of client-specific patterns.

### Base rate

The declining-label rate is **54.2%** across the 30,000 scored rows. This is the majority-class/base-rate reference that should accompany accuracy or Precision@K.

### Model comparison

| Model | ROC AUC | Average Precision | Precision@50 | Recall | F1 |
|---|---:|---:|---:|---:|---:|
| Baseline rules | 0.627 | 0.468 | 0.240 | — | — |
| Logistic regression | 0.700 | 0.522 | 0.400 | 0.567 | 0.566 |
| Decision tree | 0.742 | 0.575 | 0.540 | 0.716 | 0.634 |
| Random forest | **0.750** | **0.618** | **0.740** | **0.744** | **0.640** |

The random forest is the strongest candidate on all reported ranking metrics among the three learned models and substantially improves Precision@50 over the baseline.

### Error analysis

The current committed repository contains aggregate model metrics and ranked queue outputs, but it does **not** contain a dedicated confusion-matrix/error-slice artifact. Therefore this report does not claim a specific error pattern beyond the measured aggregate performance.

A useful next validation step is to add error slices by impression volume, content age, and client group, then inspect false positives and false negatives separately. Until that is committed, those patterns should be treated as questions rather than findings.

## 6. Interpretation

### What the model found

The committed model report identifies the following leading features:

| Feature | Importance |
|---|---:|
| `days_with_impressions` | 0.1578 |
| `log_impressions_90d` | 0.1282 |
| `avg_position` | 0.1090 |
| `content_age_days` | 0.0955 |
| `char_count` | 0.0426 |
| `word_count` | 0.0397 |
| `log_clicks_90d` | 0.0346 |
| `ctr` | 0.0330 |
| `scroll_rate` | 0.0311 |
| `days_with_sessions` | 0.0280 |

In plain language, the strongest measured signals are **how consistently a page receives impressions, its recent impression volume, its average position, and its age**. Content length contributes, but it is lower in the importance ranking than several exposure, position, and age signals.

### Important interpretation boundary

Feature importance describes predictive association within this model. It does **not** establish that changing a feature will cause search traffic to increase or decline.

### Negative result / limitation of interpretation

The model does not establish why a page is declining. The same predictive signal can be consistent with multiple underlying causes, so the queue is a prioritization aid rather than a diagnosis.

## 7. Recommendation

### Ranked editorial workflow

**Priority 1 — High-confidence review**

Start with high-confidence rows in the ranked queue. Verify the page, current search intent, recent performance, and the model's reason codes before deciding on an editorial action.

**Priority 2 — CTR / engagement investigation**

Where the queue recommends `refresh_and_review_ctr` or `refresh_and_review_engagement`, inspect the corresponding metric before making a content change.

**Priority 3 — Refresh**

Use `refresh` recommendations as a starting point for manual content review, especially where visibility and decline signals overlap.

**Priority 4 — Expand and refresh**

The `expand_and_refresh` action can identify pages where content depth is a reason code, but word count alone should not be treated as proof that expansion will improve performance.

**Priority 5 — Monitor**

Use `monitor` for lower-priority pages so editorial capacity is reserved for stronger candidates.

### Confidence

The model provides useful ranking evidence on the client-holdout used in this project: ROC AUC 0.750 and Precision@50 0.740. Confidence should be limited to the evaluated data distribution and should not be interpreted as causal evidence or as a guarantee for any individual page.

### Limits

- This is a predictive decision-support system, not a causal model.
- It does not diagnose root causes such as technical problems or external search changes.
- It should not automatically delete, redirect, rewrite, or publish content.
- The current evaluation is based on the 30,000-row anonymized starter slice.
- New-content behavior is not established by this evaluation; the preparation pipeline explicitly filters pages to at least 90 days old.

## 8. Reproducibility

### Environment

The repository uses Python and the dependencies specified in `requirements.txt`. The modeling pipeline uses pandas, NumPy, and scikit-learn.

### Random seed

```text
random_state = 42
```

### Main command

From the repository root:

```bash
pip install -r requirements.txt
python scripts/run_all.py
```

The repository documents the pipeline as:

```text
01_prepare_features.py
02_baseline_score.py
03_train_model.py
04_evaluate_and_export.py
05_build_pdf_report.py
```

### Key generated artifacts

The repository currently contains generated report/output artifacts including:

```text
outputs/model_report.md
outputs/refresh_queue_sample.csv
outputs/charts/
```

The generated model report records the model comparison, queue counts, top features, and output artifact names.

### Reproducibility requirement still to close

The capstone rubric asks for two committed artifacts when a sealed/holdout evaluation is claimed:

1. the script/cell that builds the sealed evaluation frame; and
2. the metrics file produced from that evaluation.

The current repository contains the client-holdout construction directly in `scripts/03_train_model.py` and reports the resulting metrics, but the GitHub `outputs/` directory currently does **not** show a committed `model_results.json`/metrics receipt. Therefore, before final submission, commit the evaluation metrics JSON produced by the run and, ideally, a clearly named sealed-frame/evaluation artifact so the reported numbers are independently checkable.

## 9. Acknowledgments & data credit

Built on the FlyRank ML Internship dataset.

Data and internship context: https://flyrank.ai

---

### Claims checklist

- **Observed:** the repository contains the reported model, baseline, queue, and feature-importance outputs.
- **Measured:** ROC AUC, average precision, Precision@50, recall, F1, label rate, and holdout row counts.
- **Directional:** feature-importance interpretation and editorial prioritization.
- **Decision-support:** the ranked queue and suggested actions.

No causal claim is made, and the model is not described as predicting Google's ranking algorithm.
