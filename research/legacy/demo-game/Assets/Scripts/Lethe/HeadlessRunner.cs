using UnityEngine;

namespace Lethe.SmokeTest
{
    public class HeadlessRunner : MonoBehaviour
    {
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        static void RunHeadless()
        {
            var go = new GameObject("HeadlessSmoke");
            var runner = go.AddComponent<HeadlessRunner>();
            DontDestroyOnLoad(go);
        }

        SuiSmokeTest _test;
        bool _started = false;

        void Start()
        {
            _test = gameObject.AddComponent<SuiSmokeTest>();
            _started = true;
            Debug.Log("[LETHE SMOKE TEST] Headless runner initialized");
        }
    }
}