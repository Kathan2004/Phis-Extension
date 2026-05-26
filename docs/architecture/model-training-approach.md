# AI Model Training Approach

## Objective

Train lightweight phishing text classifiers optimized for in-browser inference and explainability.

## Data Sources

- Public phishing corpora (curated and licensed datasets).
- Synthetic enterprise email templates for benign class balancing.
- Sanitized internal simulation data (never real customer content).

## Pipeline

1. Normalize and tokenize subject/body text.
2. Label classes: benign, phishing, business-email-compromise style.
3. Fine-tune compact model families (TinyBERT, DistilBERT, MiniLM).
4. Evaluate on precision/recall and calibration error.
5. Export to ONNX and quantize (INT8 dynamic quantization).
6. Validate browser inference latency and memory footprint.

## Evaluation Targets

- Precision at high-risk threshold: >= 0.95
- Recall: >= 0.90 on phishing class
- Median inference latency: < 180 ms on enterprise endpoints
- Model size: <= 35 MB quantized package

## MLOps Without Server Dependency

- CI generates versioned model artifacts.
- Signed model packages bundled in extension updates.
- Controlled rollout by extension version rings.
- Offline A/B scoring with synthetic regression corpus.
