using UnityEditor;
using UnityEngine;

public class TestUIAssembly
{
    public static void Run()
    {
        var go = new UnityEngine.GameObject();
        var canvas = go.AddComponent<UnityEngine.Canvas>();
        var text = go.AddComponent<UnityEngine.UI.Text>();
        Debug.Log("UnityEngine.UI.Text type: " + text.GetType().FullName);
        Debug.Log("Assembly: " + text.GetType().Assembly.GetName().Name);
        EditorApplication.Exit(0);
    }
}
