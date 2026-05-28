using UnityEngine;

public class PlayerController : MonoBehaviour
{
    public float speed = 4f;
    public float interactRange = 3f;

    void Update()
    {
        float h = Input.GetAxis("Horizontal");
        float v = Input.GetAxis("Vertical");
        transform.Translate(new Vector3(h, 0, v) * speed * Time.deltaTime, Space.World);

        if (Input.GetKeyDown(KeyCode.Space))
        {
            NPCController nearest = null;
            float minDist = interactRange;
            foreach (var n in FindObjectsOfType<NPCController>())
            {
                float d = Vector3.Distance(transform.position, n.transform.position);
                if (d < minDist) { minDist = d; nearest = n; }
            }
            if (nearest != null) nearest.TriggerEncounter();
        }
    }
}