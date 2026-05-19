using UnityEngine;
using UnityEditor;
using UnityEditor.SceneManagement;
using System.IO;

public class CreateKhunTumScene
{
    [MenuItem("Lethe/Create KhunTum Scene")]
    public static void Create()
    {
        // ── Clear default scene ────────────────────────────────────────────────
        var scene = EditorSceneManager.NewScene(NewSceneSetup.DefaultGameObjects, NewSceneMode.Single);
        foreach (var obj in Object.FindObjectsOfType<GameObject>())
            if (obj.name == "SampleScene" || obj.name == "Main Camera" || obj.name == "Directional Light")
                Object.DestroyImmediate(obj);

        // ── Player (cylinder body + sphere head) ───────────────────────────────
        var playerGO = new GameObject("Player");
        playerGO.transform.position = new Vector3(-3, 0, 0);

        var pBody = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
        pBody.name = "Body";
        pBody.transform.SetParent(playerGO.transform, false);
        pBody.transform.localPosition = new Vector3(0, 0.9f, 0);
        pBody.transform.localScale = new Vector3(0.65f, 0.9f, 0.65f);
        Object.DestroyImmediate(pBody.GetComponent<Collider>());
        var pBodyMat = new Material(Shader.Find("Standard"));
        pBodyMat.color = new Color(0.25f, 0.45f, 0.85f);
        pBody.GetComponent<Renderer>().material = pBodyMat;

        var pHead = GameObject.CreatePrimitive(PrimitiveType.Sphere);
        pHead.name = "Head";
        pHead.transform.SetParent(playerGO.transform, false);
        pHead.transform.localPosition = new Vector3(0, 2.0f, 0);
        pHead.transform.localScale = new Vector3(0.5f, 0.5f, 0.5f);
        Object.DestroyImmediate(pHead.GetComponent<Collider>());
        var pHeadMat = new Material(Shader.Find("Standard"));
        pHeadMat.color = new Color(0.85f, 0.65f, 0.5f);
        pHead.GetComponent<Renderer>().material = pHeadMat;

        playerGO.AddComponent<PlayerController>();

        // ── Camera with smooth follow ───────────────────────────────────────────
        var camGO = new GameObject("Main Camera");
        camGO.transform.position = new Vector3(-3, 8, -7);
        camGO.transform.rotation = Quaternion.Euler(40, 0, 0);
        camGO.AddComponent<Camera>();
        var follow = camGO.AddComponent<CameraFollow>();
        follow.target = playerGO.transform;
        follow.offset = new Vector3(0, 8, -7);
        follow.smoothTime = 0.25f;

        // ── Dialogue UI (runtime helper — avoids editor-assembly UI issue) ──────
        var dialogueHelper = DialogueUIRuntime.CreateDialogueCanvas();

        // ── KhunTum NPC (composite: robe + head + hat + eyes) ─────────────────
        var npc = new GameObject("KhunTum");
        npc.transform.position = new Vector3(3, 0, 0);

        npc.AddComponent<CapsuleCollider>().height = 2.2f;

        // Body — dark red robe
        var body = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
        body.name = "Body";
        body.transform.SetParent(npc.transform, false);
        body.transform.localPosition = new Vector3(0, 0.9f, 0);
        body.transform.localScale = new Vector3(0.7f, 0.9f, 0.7f);
        Object.DestroyImmediate(body.GetComponent<Collider>());
        var bodyMat = new Material(Shader.Find("Standard"));
        bodyMat.color = new Color(0.55f, 0.18f, 0.18f);
        body.GetComponent<Renderer>().material = bodyMat;

        // Head — skin
        var head = GameObject.CreatePrimitive(PrimitiveType.Sphere);
        head.name = "Head";
        head.transform.SetParent(npc.transform, false);
        head.transform.localPosition = new Vector3(0, 2.1f, 0);
        head.transform.localScale = new Vector3(0.55f, 0.55f, 0.55f);
        Object.DestroyImmediate(head.GetComponent<Collider>());
        var headMat = new Material(Shader.Find("Standard"));
        headMat.color = new Color(0.85f, 0.65f, 0.5f);
        head.GetComponent<Renderer>().material = headMat;

        // Hat — gold
        var hat = GameObject.CreatePrimitive(PrimitiveType.Cube);
        hat.name = "Hat";
        hat.transform.SetParent(npc.transform, false);
        hat.transform.localPosition = new Vector3(0, 2.45f, 0);
        hat.transform.localScale = new Vector3(0.6f, 0.15f, 0.6f);
        Object.DestroyImmediate(hat.GetComponent<Collider>());
        var hatMat = new Material(Shader.Find("Standard"));
        hatMat.color = new Color(0.85f, 0.7f, 0.25f);
        hat.GetComponent<Renderer>().material = hatMat;

        // Eyes
        for (int i = 0; i < 2; i++)
        {
            var eye = GameObject.CreatePrimitive(PrimitiveType.Cube);
            eye.name = "Eye" + i;
            eye.transform.SetParent(head.transform, false);
            eye.transform.localPosition = new Vector3(i == 0 ? -0.2f : 0.2f, 0.05f, -0.45f);
            eye.transform.localScale = new Vector3(0.12f, 0.12f, 0.05f);
            Object.DestroyImmediate(eye.GetComponent<Collider>());
            var eyeMat = new Material(Shader.Find("Standard"));
            eyeMat.color = Color.black;
            eye.GetComponent<Renderer>().material = eyeMat;
        }

        // NPC Controller wired to UI
        var npcCtrl = npc.AddComponent<NPCController>();
        npcCtrl.playerWallet = "0x4bf22d697cacb24e23037e804157896ddfaaf7a3d86940df777c1ad31a868077";
        npcCtrl.dialogueText = dialogueHelper.dialogueText;
        npcCtrl.dialogueElements = dialogueHelper.dialogueElements;

        // ── Ground + pillars ───────────────────────────────────────────────────
        var ground = GameObject.CreatePrimitive(PrimitiveType.Plane);
        ground.name = "Ground";
        ground.transform.localScale = new Vector3(3, 1, 3);
        var gMat = new Material(Shader.Find("Standard"));
        gMat.color = new Color(0.18f, 0.16f, 0.20f);
        ground.GetComponent<Renderer>().material = gMat;

        for (int i = 0; i < 4; i++)
        {
            float x = (i % 2 == 0 ? -1 : 1) * 5f;
            float z = (i < 2 ? -1 : 1) * 4f;

            var pillar = GameObject.CreatePrimitive(PrimitiveType.Cube);
            pillar.name = "Pillar" + i;
            pillar.transform.position = new Vector3(x, 1.5f, z);
            pillar.transform.localScale = new Vector3(0.4f, 3f, 0.4f);
            Object.DestroyImmediate(pillar.GetComponent<Collider>());
            var pmat = new Material(Shader.Find("Standard"));
            pmat.color = new Color(0.3f, 0.25f, 0.3f);
            pillar.GetComponent<Renderer>().material = pmat;

            var glow = GameObject.CreatePrimitive(PrimitiveType.Cube);
            glow.name = "Glow" + i;
            glow.transform.position = new Vector3(x, 3.2f, z);
            glow.transform.localScale = new Vector3(0.3f, 0.3f, 0.3f);
            Object.DestroyImmediate(glow.GetComponent<Collider>());
            var glowMat = new Material(Shader.Find("Standard"));
            glowMat.EnableKeyword("_EMISSION");
            glowMat.SetColor("_EmissionColor", new Color(0.7f, 0.4f, 1f) * 2f);
            glowMat.color = new Color(0.7f, 0.4f, 1f);
            glow.GetComponent<Renderer>().material = glowMat;

            var lightGO = new GameObject("Light" + i);
            lightGO.transform.position = new Vector3(x, 3.2f, z);
            var light = lightGO.AddComponent<Light>();
            light.type = LightType.Point;
            light.color = new Color(0.7f, 0.4f, 1f);
            light.intensity = 2f;
            light.range = 8f;
        }

        // Directional + ambient
        var dirGO = new GameObject("Directional Light");
        var dirLight = dirGO.AddComponent<Light>();
        dirLight.type = LightType.Directional;
        dirLight.intensity = 0.6f;
        dirLight.color = new Color(0.9f, 0.85f, 0.95f);
        dirGO.transform.rotation = Quaternion.Euler(50, -30, 0);
        RenderSettings.ambientLight = new Color(0.15f, 0.12f, 0.2f);

        // ── Save ──────────────────────────────────────────────────────────────
        Selection.activeGameObject = playerGO;
        EditorSceneManager.MarkSceneDirty(scene);
        EditorSceneManager.SaveScene(scene, "Assets/Scenes/KhunTumEncounter.unity");
        Debug.Log("[Lethe] KhunTumEncounter.unity created — Day 7 polish");
    }
}
