package com.cronicas.abismo;

import android.app.Activity;
import android.app.AlertDialog;
import android.os.Bundle;
import android.os.Build;
import android.graphics.Color;
import android.content.res.Configuration;
import android.net.Uri;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceError;
import java.io.InputStream;
import java.io.IOException;

public final class MainActivity extends Activity {
    private static final String ASSETS_HOST = "appassets.androidplatform.net";
    private WebView web;
    private boolean localPage = true;
    private String remoteHost = null;
    private int remotePort = 8080;
    private boolean errorDialogShown = false;

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        fullscreen();
        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(9, 14, 24));
        setContentView(web);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setAllowFileAccessFromFileURLs(false);
        s.setAllowUniversalAccessFromFileURLs(false);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setMediaPlaybackRequiresUserGesture(true);
        if (Build.VERSION.SDK_INT >= 26) s.setSafeBrowsingEnabled(true);
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                if (!"https".equals(u.getScheme()) || !ASSETS_HOST.equals(u.getHost())) return null;
                String p = u.getPath();
                if (p == null || !p.startsWith("/assets/www/")) return forbidden();
                String filename = p.substring("/assets/www/".length());
                if (filename.isEmpty()) filename = "index.html";
                if (filename.contains("..") || filename.contains("\\") || filename.startsWith("/")) return forbidden();
                String mime = filename.endsWith(".html") ? "text/html" :
                        filename.endsWith(".css") ? "text/css" :
                        filename.endsWith(".js") ? "application/javascript" :
                        filename.endsWith(".svg") ? "image/svg+xml" :
                        filename.endsWith(".png") ? "image/png" : "text/plain";
                try {
                    InputStream stream = getAssets().open("www/" + filename);
                    return new WebResourceResponse(mime, "UTF-8", 200, "OK",
                            java.util.Collections.singletonMap("Cache-Control","no-store"), stream);
                } catch (IOException e) {
                    return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found",
                            java.util.Collections.emptyMap(), new java.io.ByteArrayInputStream(new byte[0]));
                }
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                if (localPage) return !("https".equals(u.getScheme()) && ASSETS_HOST.equals(u.getHost()));
                return !("http".equals(u.getScheme()) && remoteHost != null &&
                         remoteHost.equals(u.getHost()) && (u.getPort() == remotePort || (remotePort == 80 && u.getPort() == -1)));
            }
            @Override public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (!localPage && request.isForMainFrame() && !errorDialogShown) {
                    errorDialogShown = true;
                    runOnUiThread(() -> new AlertDialog.Builder(MainActivity.this)
                            .setTitle("No se pudo conectar a la PC")
                            .setMessage("Revisá que el servidor esté iniciado, que ambos dispositivos estén en la misma red y que el puerto " + remotePort + " esté permitido.")
                            .setNegativeButton("VOLVER AL MENÚ", (d,w) -> openLocal())
                            .setPositiveButton("REINTENTAR", (d,w) -> openLanInternal(remoteHost,remotePort))
                            .setCancelable(false).show());
                }
            }
        });
        openLocal();
    }

    private static WebResourceResponse forbidden() {
        return new WebResourceResponse("text/plain","UTF-8",403,"Forbidden",
                java.util.Collections.emptyMap(),new java.io.ByteArrayInputStream(new byte[0]));
    }

    private void fullscreen() {
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_FULLSCREEN|View.SYSTEM_UI_FLAG_HIDE_NAVIGATION|
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY|View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN|
                View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
    }

    private static boolean privateIp(String host) {
        if (host == null || !host.matches("[0-9]{1,3}(\\.[0-9]{1,3}){3}")) return false;
        String[] s = host.split("\\.");
        int[] v = new int[4];
        try {
            for (int i=0;i<4;i++) {v[i]=Integer.parseInt(s[i]); if(v[i]>255)return false;}
        } catch (NumberFormatException e) {return false;}
        return v[0]==10 || (v[0]==192 && v[1]==168) || (v[0]==172 && v[1]>=16 && v[1]<=31);
    }

    @JavascriptInterface public void connectLan(String address) {
        runOnUiThread(() -> {
            try {
                String a = address.trim().replaceFirst("^https?://","").replaceFirst("/.*$","");
                Uri u=Uri.parse("http://" + a);
                String host=u.getHost();
                int port=u.getPort()==-1?8080:u.getPort();
                if(!localPage || !privateIp(host) || port<1 || port>65535 || u.getUserInfo()!=null) {
                    web.evaluateJavascript("window.abismoNotify && window.abismoNotify('Usá una IP privada como 192.168.1.10:8080')",null);
                    return;
                }
                openLanInternal(host,port);
            } catch(Exception e) {
                web.evaluateJavascript("window.abismoNotify && window.abismoNotify('Dirección LAN inválida')",null);
            }
        });
    }

    private void openLanInternal(String host,int port) {
        localPage=false;remoteHost=host;remotePort=port;errorDialogShown=false;
        web.removeJavascriptInterface("AndroidBridge");
        web.loadUrl("http://" + host + ":" + port + "/");
        fullscreen();
    }

    private void openLocal() {
        localPage=true;remoteHost=null;errorDialogShown=false;
        web.addJavascriptInterface(this,"AndroidBridge");
        web.loadUrl("https://" + ASSETS_HOST + "/assets/www/index.html");
        fullscreen();
    }

    @Override public void onBackPressed() {
        if (localPage) {
            web.evaluateJavascript("window.abismoBack && window.abismoBack()",null);
        } else {
            new AlertDialog.Builder(this).setTitle("Volver al menú")
                .setMessage("Salir durante una expedición LAN puede provocar la pérdida del botín que llevás.")
                .setNegativeButton("SEGUIR JUGANDO",(d,w)->fullscreen())
                .setPositiveButton("VOLVER",(d,w)->openLocal()).show();
        }
    }
    @Override protected void onResume(){super.onResume();web.onResume();fullscreen();}
    @Override protected void onPause(){web.onPause();super.onPause();}
    @Override protected void onDestroy(){web.destroy();super.onDestroy();}
}
