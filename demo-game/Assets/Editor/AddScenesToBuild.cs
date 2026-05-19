using UnityEditor;
using UnityEngine;

public class AddScenesToBuild
{
    public static void Run()
    {
        EditorBuildSettings.scenes = new[] {
            new EditorBuildSettingsScene("Assets/Scenes/KhunTumEncounter.unity", true)
        };
        Debug.Log("[LETHE] Build settings updated with KhunTumEncounter scene");
    }
}