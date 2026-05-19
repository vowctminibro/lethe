using UnityEngine;
using UnityEngine.UI;
using Lethe;
using System.Collections;

public class NPCController : MonoBehaviour
{
    public Text dialogueText;
    public GameObject[] dialogueElements; // panel + border
    public string playerWallet = "0x4bf22d697cacb24e23037e804157896ddfaaf7a3d86940df777c1ad31a868077";

    LetheClient lethe = new LetheClient();
    bool isInteracting = false;

    void SetDialogueVisible(bool visible)
    {
        if (dialogueElements == null) return;
        foreach (var el in dialogueElements)
            if (el != null) el.SetActive(visible);
    }

    public void TriggerEncounter()
    {
        if (isInteracting) return;
        isInteracting = true;
        SetDialogueVisible(true);
        StartCoroutine(GreetPlayer());
    }

    IEnumerator GreetPlayer()
    {
        if (dialogueText != null) dialogueText.text = "...";

        yield return lethe.Recall(playerWallet,
            onSuccess: (resp, rawJson) => {
                string line = ComposeGreeting(resp, rawJson);
                if (dialogueText != null) dialogueText.text = line;
                Debug.Log("[LETHE NPC] " + line);
                StartCoroutine(ClearAfter(10f));
            },
            onError: (err) => {
                if (dialogueText != null) dialogueText.text = "Khun Tum: ...who are you, stranger?";
                Debug.LogError("[LETHE NPC] Recall failed: " + err);
                StartCoroutine(ClearAfter(6f));
            });
    }

    string ComposeGreeting(RecallResponse resp, string rawJson)
    {
        if (resp == null || resp.events == null || resp.events.Length == 0)
            return "Khun Tum: A stranger. We have not met.";

        // Extract @event from raw JSON — JsonUtility can't read @-prefixed keys
        string latestEvent = LetheJson.ExtractLatestEvent(rawJson);
        if (string.IsNullOrEmpty(latestEvent))
            return "Khun Tum: I sense familiarity, but my memory is hazy.";

        return $"Khun Tum: You again, thief! I remember — you {latestEvent}.";
    }

    IEnumerator ClearAfter(float seconds)
    {
        yield return new WaitForSeconds(seconds);
        if (dialogueText != null) dialogueText.text = "";
        SetDialogueVisible(false);
        isInteracting = false;
    }
}