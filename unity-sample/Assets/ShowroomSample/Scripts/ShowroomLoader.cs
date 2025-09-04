using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Networking;
using UnityEngine.UI;
using UnityEngine.Video;

[System.Serializable]
public class ShowroomManifest
{
    public string slug;
    public string title;
    public string shortDescription;
    public string longDescription;
    public ThemeData theme;
    public AssetData assets;
    public string updatedAt;
}

[System.Serializable]
public class ThemeData
{
    public string primary;
    public string accent;
}

[System.Serializable]
public class AssetData
{
    public string logo;
    public string header;
    public string[] screenshots;
    public TrailerData trailer;
}

[System.Serializable]
public class TrailerData
{
    public string type;
    public string src;
    public int duration;
}

public class ShowroomLoader : MonoBehaviour
{
    [Header("Configuration")]
    [SerializeField] private string manifestUrl = "https://your-render-service.onrender.com/api/manifest";
    [SerializeField] private string slug = "my-space-shooter";
    
    [Header("UI References")]
    [SerializeField] private RawImage logoImage;
    [SerializeField] private RawImage headerImage;
    [SerializeField] private Text titleText;
    [SerializeField] private Text shortDescText;
    [SerializeField] private Text longDescText;
    [SerializeField] private VideoPlayer trailerPlayer;
    [SerializeField] private Transform screenshotsContainer;
    [SerializeField] private GameObject screenshotPrefab;
    
    [Header("Loading")]
    [SerializeField] private GameObject loadingPanel;
    [SerializeField] private Text loadingText;
    
    private ShowroomManifest currentManifest;
    private List<RawImage> screenshotImages = new List<RawImage>();
    
    private void Start()
    {
        StartCoroutine(LoadShowroom());
    }
    
    private IEnumerator LoadShowroom()
    {
        ShowLoading(true, "Loading showroom...");
        
        // Load manifest
        yield return StartCoroutine(LoadManifest());
        
        if (currentManifest == null)
        {
            ShowError("Failed to load showroom manifest");
            yield break;
        }
        
        // Apply theme
        ApplyTheme();
        
        // Update text content
        UpdateTextContent();
        
        // Load assets
        yield return StartCoroutine(LoadAssets());
        
        ShowLoading(false);
    }
    
    private IEnumerator LoadManifest()
    {
        string url = $"{manifestUrl}/{slug}";
        Debug.Log($"Loading manifest from: {url}");
        
        using (UnityWebRequest request = UnityWebRequest.Get(url))
        {
            yield return request.SendWebRequest();
            
            if (request.result == UnityWebRequest.Result.Success)
            {
                try
                {
                    currentManifest = JsonUtility.FromJson<ShowroomManifest>(request.downloadHandler.text);
                    Debug.Log($"Manifest loaded: {currentManifest.title}");
                }
                catch (Exception e)
                {
                    Debug.LogError($"Failed to parse manifest JSON: {e.Message}");
                    currentManifest = null;
                }
            }
            else
            {
                Debug.LogError($"Failed to load manifest: {request.error}");
                currentManifest = null;
            }
        }
    }
    
    private void ApplyTheme()
    {
        if (currentManifest?.theme == null) return;
        
        // Apply primary color to background or other elements
        if (ColorUtility.TryParseHtmlString(currentManifest.theme.primary, out Color primaryColor))
        {
            Camera.main.backgroundColor = primaryColor;
        }
        
        // Apply accent color to UI elements
        if (ColorUtility.TryParseHtmlString(currentManifest.theme.accent, out Color accentColor))
        {
            if (titleText != null)
                titleText.color = accentColor;
        }
    }
    
    private void UpdateTextContent()
    {
        if (currentManifest == null) return;
        
        if (titleText != null)
            titleText.text = currentManifest.title;
            
        if (shortDescText != null)
            shortDescText.text = currentManifest.shortDescription;
            
        if (longDescText != null)
            longDescText.text = currentManifest.longDescription;
    }
    
    private IEnumerator LoadAssets()
    {
        // Load logo
        if (!string.IsNullOrEmpty(currentManifest.assets.logo))
        {
            yield return StartCoroutine(LoadTexture(currentManifest.assets.logo, logoImage));
        }
        
        // Load header
        if (!string.IsNullOrEmpty(currentManifest.assets.header))
        {
            yield return StartCoroutine(LoadTexture(currentManifest.assets.header, headerImage));
        }
        
        // Load screenshots
        if (currentManifest.assets.screenshots != null && currentManifest.assets.screenshots.Length > 0)
        {
            yield return StartCoroutine(LoadScreenshots());
        }
        
        // Setup trailer
        if (currentManifest.assets.trailer != null && !string.IsNullOrEmpty(currentManifest.assets.trailer.src))
        {
            SetupTrailer();
        }
    }
    
    private IEnumerator LoadTexture(string url, RawImage targetImage)
    {
        if (targetImage == null) yield break;
        
        Debug.Log($"Loading texture: {url}");
        
        using (UnityWebRequest request = UnityWebRequestTexture.GetTexture(url))
        {
            yield return request.SendWebRequest();
            
            if (request.result == UnityWebRequest.Result.Success)
            {
                Texture2D texture = DownloadHandlerTexture.GetContent(request);
                targetImage.texture = texture;
                Debug.Log($"Texture loaded: {url}");
            }
            else
            {
                Debug.LogError($"Failed to load texture {url}: {request.error}");
            }
        }
    }
    
    private IEnumerator LoadScreenshots()
    {
        if (screenshotsContainer == null || screenshotPrefab == null) yield break;
        
        // Clear existing screenshots
        foreach (Transform child in screenshotsContainer)
        {
            Destroy(child.gameObject);
        }
        screenshotImages.Clear();
        
        // Load each screenshot
        foreach (string screenshotUrl in currentManifest.assets.screenshots)
        {
            GameObject screenshotObj = Instantiate(screenshotPrefab, screenshotsContainer);
            RawImage screenshotImage = screenshotObj.GetComponent<RawImage>();
            
            if (screenshotImage != null)
            {
                screenshotImages.Add(screenshotImage);
                yield return StartCoroutine(LoadTexture(screenshotUrl, screenshotImage));
            }
        }
    }
    
    private void SetupTrailer()
    {
        if (trailerPlayer == null) return;
        
        var trailer = currentManifest.assets.trailer;
        
        if (trailer.type == "url" || trailer.type == "file")
        {
            trailerPlayer.url = trailer.src;
            trailerPlayer.Prepare();
            Debug.Log($"Trailer setup: {trailer.src}");
        }
    }
    
    private void ShowLoading(bool show, string message = "")
    {
        if (loadingPanel != null)
            loadingPanel.SetActive(show);
            
        if (loadingText != null)
            loadingText.text = message;
    }
    
    private void ShowError(string message)
    {
        Debug.LogError(message);
        ShowLoading(false);
        
        // You could show an error UI here
        if (titleText != null)
            titleText.text = "Error: " + message;
    }
    
    // Public methods for external control
    public void LoadShowroom(string newSlug)
    {
        slug = newSlug;
        StartCoroutine(LoadShowroom());
    }
    
    public void PlayTrailer()
    {
        if (trailerPlayer != null && !string.IsNullOrEmpty(trailerPlayer.url))
        {
            trailerPlayer.Play();
        }
    }
    
    public void StopTrailer()
    {
        if (trailerPlayer != null)
        {
            trailerPlayer.Stop();
        }
    }
}
