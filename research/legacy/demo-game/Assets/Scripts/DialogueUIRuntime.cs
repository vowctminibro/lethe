using UnityEngine;
using UnityEngine.UI;

public class DialogueUIRuntime : MonoBehaviour
{
    public Text dialogueText;
    public GameObject[] dialogueElements; // panel + border

    public static DialogueUIRuntime CreateDialogueCanvas()
    {
        // Canvas
        var canvasGO = new GameObject("DialogueCanvas");
        canvasGO.transform.position = Vector3.zero;
        var canvas = canvasGO.AddComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        canvasGO.AddComponent<CanvasScaler>();
        canvasGO.AddComponent<GraphicRaycaster>();

        // Purple border (behind panel)
        var borderGO = new GameObject("DialogueBorder");
        borderGO.transform.SetParent(canvasGO.transform, false);
        var borderImg = borderGO.AddComponent<Image>();
        borderImg.color = new Color(0.55f, 0.3f, 0.9f, 0.7f);
        var borderRT = borderGO.GetComponent<RectTransform>();
        borderRT.anchorMin = new Vector2(0.05f, 0.05f);
        borderRT.anchorMax = new Vector2(0.95f, 0.28f);
        borderRT.offsetMin = new Vector2(-4, -4);
        borderRT.offsetMax = new Vector2(4, 4);

        // Panel (black)
        var panelGO = new GameObject("DialoguePanel");
        panelGO.transform.SetParent(canvasGO.transform, false);
        var panelImg = panelGO.AddComponent<Image>();
        panelImg.color = new Color(0, 0, 0, 0.85f);
        var panelRT = panelGO.GetComponent<RectTransform>();
        panelRT.anchorMin = new Vector2(0.05f, 0.05f);
        panelRT.anchorMax = new Vector2(0.95f, 0.28f);
        panelRT.offsetMin = Vector2.zero;
        panelRT.offsetMax = Vector2.zero;

        // Name plate
        var nameGO = new GameObject("NamePlate");
        nameGO.transform.SetParent(panelGO.transform, false);
        var nameImg = nameGO.AddComponent<Image>();
        nameImg.color = new Color(0.55f, 0.3f, 0.9f, 0.95f);
        var nameRT = nameGO.GetComponent<RectTransform>();
        nameRT.anchorMin = new Vector2(0, 1);
        nameRT.anchorMax = new Vector2(0, 1);
        nameRT.pivot = new Vector2(0, 1);
        nameRT.sizeDelta = new Vector2(180, 38);
        nameRT.anchoredPosition = new Vector2(20, 22);

        var nameTextGO = new GameObject("NameText");
        nameTextGO.transform.SetParent(nameGO.transform, false);
        var nameText = nameTextGO.AddComponent<Text>();
        nameText.text = "KHUN TUM";
        nameText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
        nameText.fontSize = 22;
        nameText.fontStyle = FontStyle.Bold;
        nameText.color = Color.white;
        nameText.alignment = TextAnchor.MiddleCenter;
        var nameTRT = nameText.GetComponent<RectTransform>();
        nameTRT.anchorMin = Vector2.zero;
        nameTRT.anchorMax = Vector2.one;
        nameTRT.offsetMin = Vector2.zero;
        nameTRT.offsetMax = Vector2.zero;

        // Body text
        var textGO = new GameObject("DialogueText");
        textGO.transform.SetParent(panelGO.transform, false);
        var dialogueText = textGO.AddComponent<Text>();
        dialogueText.text = "";
        dialogueText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
        dialogueText.fontSize = 32;
        dialogueText.color = Color.white;
        dialogueText.alignment = TextAnchor.UpperLeft;
        dialogueText.horizontalOverflow = HorizontalWrapMode.Wrap;
        dialogueText.verticalOverflow = VerticalWrapMode.Truncate;
        var textRT = dialogueText.GetComponent<RectTransform>();
        textRT.anchorMin = new Vector2(0, 0);
        textRT.anchorMax = new Vector2(1, 1);
        textRT.offsetMin = new Vector2(30, 30);
        textRT.offsetMax = new Vector2(-30, -50);

        // Initially hidden
        panelGO.SetActive(false);
        borderGO.SetActive(false);

        // Runtime helper
        var helper = canvasGO.AddComponent<DialogueUIRuntime>();
        helper.dialogueText = dialogueText;
        helper.dialogueElements = new GameObject[] { panelGO, borderGO };

        return helper;
    }
}
