Zero Division V27

Weapon view-model is rendered in a dedicated overlay scene using the Normal/ADS camera transforms from assets/m4a1_config.json verbatim. The model is not rotated by the player camera, avoiding accidental left/right lean and side-view orientation caused by double transforms.


## ADS fix
- AKM ADS now uses only its editor-defined local weapon pose.
- Removed camera-derived AKM rotation that could shift the iron-sight viewpoint during ADS.
