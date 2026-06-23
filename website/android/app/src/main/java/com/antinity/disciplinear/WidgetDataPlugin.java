package com.antinity.disciplinear;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.Intent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WidgetData")
public class WidgetDataPlugin extends Plugin {

    @PluginMethod
    public void update(PluginCall call) {
        Integer pct = call.getInt("pct", 0);
        Integer completed = call.getInt("completed", 0);
        Integer total = call.getInt("total", 0);
        Integer streak = call.getInt("streak", 0);

        Context context = getContext();
        SharedPreferences sharedPref = context.getSharedPreferences("DisciplinearWidgetPref", Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = sharedPref.edit();
        editor.putInt("pct", pct);
        editor.putInt("completed", completed);
        editor.putInt("total", total);
        editor.putInt("streak", streak);
        editor.apply();

        // Trigger widget update
        Intent intent = new Intent(context, HabitWidgetProvider.class);
        intent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
        int[] ids = AppWidgetManager.getInstance(context).getAppWidgetIds(new ComponentName(context, HabitWidgetProvider.class));
        intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
        context.sendBroadcast(intent);

        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }
}
