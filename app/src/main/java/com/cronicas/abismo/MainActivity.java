package com.cronicas.abismo;

import android.app.Activity;
import android.app.AlertDialog;
import android.os.Bundle;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.content.res.ColorStateList;
import android.net.Uri;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.widget.*;
import android.text.InputType;

public final class MainActivity extends Activity {
    private final int GOLD = Color.rgb(232,187,107);
    private final int CREAM = Color.rgb(246,236,220);
    private final int DARK = Color.rgb(13,17,26);
    private FrameLayout root;
    private WebView browser;
    private String serverHost;
    private int serverPort = 8080;
    private boolean errorShown = false;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        landscapeFullscreen();
        root = new FrameLayout(this);
        setContentView(root);
        showLobby();
    }

    private int dp(float v){return (int)(v*getResources().getDisplayMetrics().density + .5f);}
    private GradientDrawable background(int color,int corners){
        GradientDrawable d=new GradientDrawable();d.setColor(color);d.setCornerRadius(dp(corners));return d;
    }
    private TextView text(String label,int size,int color,boolean bold){
        TextView t=new TextView(this);t.setText(label);t.setTextColor(color);t.setTextSize(size);
        t.setGravity(Gravity.CENTER);if(bold)t.setTypeface(Typeface.DEFAULT,Typeface.BOLD);return t;
    }
    private void place(LinearLayout layout,View v,int bottom){
        LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,-2);
        p.bottomMargin=dp(bottom);layout.addView(v,p);
    }
    private void landscapeFullscreen(){
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_FULLSCREEN|View.SYSTEM_UI_FLAG_HIDE_NAVIGATION|
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY|View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN|
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
    }
    private void releaseBrowser(){
        if(browser!=null){browser.stopLoading();browser.loadUrl("about:blank");browser.destroy();browser=null;}
    }
    private void showLobby(){
        releaseBrowser();root.removeAllViews();errorShown=false;
        GradientDrawable backdrop=new GradientDrawable(GradientDrawable.Orientation.TL_BR,
            new int[]{Color.rgb(34,19,28),DARK,Color.rgb(20,37,40)});
        root.setBackground(backdrop);
        ScrollView scroll=new ScrollView(this);scroll.setFillViewport(true);
        root.addView(scroll,new FrameLayout.LayoutParams(-1,-1));
        LinearLayout outer=new LinearLayout(this);outer.setGravity(Gravity.CENTER);
        outer.setPadding(dp(20),dp(12),dp(20),dp(12));outer.setOrientation(LinearLayout.VERTICAL);
        scroll.addView(outer,new ScrollView.LayoutParams(-1,-1));
        LinearLayout panel=new LinearLayout(this);panel.setOrientation(LinearLayout.VERTICAL);
        panel.setPadding(dp(22),dp(18),dp(22),dp(16));
        GradientDrawable panelBg=background(Color.rgb(23,28,37),18);
        panelBg.setStroke(dp(1),Color.rgb(108,81,50));panel.setBackground(panelBg);
        LinearLayout.LayoutParams panelParams=new LinearLayout.LayoutParams(-1,-2);
        panelParams.width=Math.min(dp(520),getResources().getDisplayMetrics().widthPixels-dp(40));
        outer.addView(panel,panelParams);
        place(panel,text("⚔",40,GOLD,true),0);
        place(panel,text("CRÓNICAS DEL ABISMO",23,GOLD,true),2);
        place(panel,text("LAS PUERTAS OLVIDADAS  •  V0.1",11,CREAM,false),18);
        place(panel,text("UNIRSE A UNA PARTIDA LAN",16,CREAM,true),8);
        place(panel,text("Iniciá el servidor en la PC y conectá el teléfono al mismo Wi-Fi.",13,Color.rgb(188,185,179),false),14);
        EditText ip=new EditText(this);ip.setTextSize(18);ip.setTextColor(CREAM);
        ip.setHintTextColor(Color.rgb(159,156,149));ip.setHint("192.168.1.100:8080");
        ip.setSingleLine(true);ip.setGravity(Gravity.CENTER);
        ip.setInputType(InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_URI);
        ip.setPadding(dp(14),dp(10),dp(14),dp(10));ip.setBackground(background(DARK,10));
        ip.setText(getPreferences(MODE_PRIVATE).getString("host",""));
        place(panel,ip,12);
        Button play=new Button(this);play.setText("CONECTAR Y JUGAR");play.setAllCaps(false);
        play.setTextColor(DARK);play.setTypeface(Typeface.DEFAULT,Typeface.BOLD);
        play.setBackground(background(GOLD,10));place(panel,play,12);
        play.setOnClickListener(v->connect(ip.getText().toString()));
        place(panel,text("El servidor guarda personajes y baúl. Android es el cliente de juego.",12,Color.rgb(162,164,166),false),0);
    }

    private static boolean isPrivateIp(String host){
        if(host==null || !host.matches("[0-9]{1,3}(\\.[0-9]{1,3}){3}"))return false;
        String[] parts=host.split("\\.");
        int[] a=new int[4];
        for(int i=0;i<4;i++){a[i]=Integer.parseInt(parts[i]);if(a[i]>255)return false;}
        return a[0]==10||(a[0]==192&&a[1]==168)||(a[0]==172&&a[1]>=16&&a[1]<=31);
    }

    private void connect(String address){
        try{
            String raw=address.trim().replaceFirst("^https?://","").replaceFirst("/.*$","");
            Uri uri=Uri.parse("http://"+raw);
            String host=uri.getHost();int port=uri.getPort()==-1?8080:uri.getPort();
            if(!isPrivateIp(host)||port<1||port>65535||uri.getUserInfo()!=null){
                new AlertDialog.Builder(this).setTitle("Dirección inválida")
                    .setMessage("Ingresá la IP privada de la PC, por ejemplo 192.168.1.10:8080.")
                    .setPositiveButton("OK",null).show();return;
            }
            serverHost=host;serverPort=port;
            getPreferences(MODE_PRIVATE).edit().putString("host",raw).apply();
            startWeb();
        }catch(Exception e){
            new AlertDialog.Builder(this).setMessage("Revisá la IP de la PC.")
                .setPositiveButton("OK",null).show();
        }
    }

    private void startWeb(){
        releaseBrowser();root.removeAllViews();root.setBackgroundColor(DARK);errorShown=false;
        browser=new WebView(this);
        WebSettings settings=browser.getSettings();
        settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);settings.setAllowContentAccess(false);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportZoom(false);settings.setBuiltInZoomControls(false);
        browser.setBackgroundColor(DARK);
        browser.setWebChromeClient(new WebChromeClient());
        browser.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){
                Uri link=request.getUrl();
                return !("http".equals(link.getScheme())&&serverHost.equals(link.getHost())&&serverPort==link.getPort());
            }
            @Override public void onReceivedError(WebView view,WebResourceRequest request,WebResourceError error){
                if(request.isForMainFrame()&&!errorShown){
                    errorShown=true;
                    runOnUiThread(()->new AlertDialog.Builder(MainActivity.this)
                        .setTitle("Sin conexión LAN")
                        .setMessage("Comprobá que la PC esté ejecutando el servidor Node.js, la IP sea correcta y el puerto "+serverPort+" esté permitido.")
                        .setNegativeButton("CAMBIAR IP",(d,w)->showLobby())
                        .setPositiveButton("REINTENTAR",(d,w)->startWeb())
                        .setCancelable(false).show());
                }
            }
        });
        root.addView(browser,new FrameLayout.LayoutParams(-1,-1));
        browser.loadUrl("http://"+serverHost+":"+serverPort+"/");
        landscapeFullscreen();
    }
    @Override public void onBackPressed(){
        if(browser==null){super.onBackPressed();return;}
        new AlertDialog.Builder(this).setTitle("Salir de la expedición")
            .setMessage("Al desconectarte dentro de la mazmorra se pierde el equipo de esa expedición. ¿Volver al menú?")
            .setNegativeButton("SEGUIR JUGANDO",(d,w)->landscapeFullscreen())
            .setPositiveButton("DESCONECTAR",(d,w)->showLobby()).show();
    }
    @Override protected void onResume(){super.onResume();if(browser!=null)browser.onResume();landscapeFullscreen();}
    @Override protected void onPause(){if(browser!=null)browser.onPause();super.onPause();}
    @Override protected void onDestroy(){releaseBrowser();super.onDestroy();}
}
