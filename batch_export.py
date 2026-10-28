import numpy as np
import json
import os

# Create destination directory
output_dir = "public/keypoints"
os.makedirs(output_dir, exist_ok=True)

# Load extracted dataset matrices
print("Loading dataset files...")
x_data = np.load("public/keypoint-coordinates/x_output (1).npy")
y_data = np.load("public/keypoint-coordinates/y_output.npy")

# Add common ASL words you want to support
target_words = [
    "HELLO", "HOW", "YOU", "THANK-YOU", "PLEASE", 
    "YES", "NO", "BUY", "WANT", "GOOD", "HELP", "SEE"
]

processed_words = set()

for idx, frame_sequence in enumerate(x_data):
    label_raw = y_data[idx]
    if isinstance(label_raw, bytes):
        label = label_raw.decode().upper().strip()
    else:
        label = str(label_raw).upper().strip()
    
    if label in target_words and label not in processed_words:
        keyframe_sequence = []
        
        for frame in frame_sequence:
            keyframe_sequence.append({
                "right_shoulder": frame[12].tolist() if len(frame) > 12 else [0, 0, 0],
                "right_elbow":    frame[14].tolist() if len(frame) > 14 else [0, 0, 0],
                "right_wrist":    frame[16].tolist() if len(frame) > 16 else [0, 0, 0],
                "left_shoulder":  frame[11].tolist() if len(frame) > 11 else [0, 0, 0],
                "left_elbow":     frame[13].tolist() if len(frame) > 13 else [0, 0, 0],
                "left_wrist":     frame[15].tolist() if len(frame) > 15 else [0, 0, 0]
            })

        for filename in [f"{label}.json", f"{label.lower()}.json"]:
            with open(os.path.join(output_dir, filename), "w") as f:
                json.dump(keyframe_sequence, f)

        processed_words.add(label)
        print(f"✅ Exported: {label}.json")

print(f"\nDone! Exported {len(processed_words)} word keypoint sequences to public/keypoints/")
