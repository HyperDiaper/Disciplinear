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
        String habitsJson = call.getString("habitsJson", "[]");

        Context context = getContext();
        SharedPreferences sharedPref = context.getSharedPreferences("DisciplinearWidgetPref", Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = sharedPref.edit();
        editor.putInt("pct", pct);
        editor.putInt("completed", completed);
        editor.putInt("total", total);
        editor.putInt("streak", streak);
        editor.putString("habitsJson", habitsJson);
        editor.commit(); // Synchronous commit

        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);

        // 1. Update HabitWidgetProvider (Summary)
        int[] summaryIds = appWidgetManager.getAppWidgetIds(new ComponentName(context, HabitWidgetProvider.class));
        if (summaryIds.length > 0) {
            HabitWidgetProvider summaryProvider = new HabitWidgetProvider();
            summaryProvider.onUpdate(context, appWidgetManager, summaryIds);
        }

        // 2. Update HabitsListWidgetProvider (List)
        int[] listIds = appWidgetManager.getAppWidgetIds(new ComponentName(context, HabitsListWidgetProvider.class));
        if (listIds.length > 0) {
            HabitsListWidgetProvider listProvider = new HabitsListWidgetProvider();
            listProvider.onUpdate(context, appWidgetManager, listIds);
            appWidgetManager.notifyAppWidgetViewDataChanged(listIds, R.id.widget_habits_list);
        }

        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }
}
