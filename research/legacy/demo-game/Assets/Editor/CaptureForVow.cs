using UnityEngine;
using UnityEditor;
using UnityEditor.SceneManagement;
using System.IO;

public class CaptureForVow {
    [MenuItem("Lethe/Capture Screenshot")]
    public static void Capture() {
        EditorSceneManager.OpenScene("Assets/Scenes/KhunTumEncounter.unity");

        // Position player next to NPC
        var player = GameObject.Find("Player");
        if (player != null) {
            player.transform.position = new Vector3(1.5f, 0, 0);
            Debug.Log("[LETHE] Player repositioned to x=1.5 (adjacent to NPC at x=3)");
        }

        // Take screenshot
        string dir = "Screenshots";
        if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);
        string path = Path.Combine(dir, "day7-encounter-test.png");
        ScreenCapture.CaptureScreenshot(path);
        Debug.Log("[LETHE] Screenshot captured: " + path);

        EditorSceneManager.SaveScene(EditorSceneManager.GetActiveScene());
    }
}
