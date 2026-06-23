package com.antinity.disciplinear;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

public class HabitWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        SharedPreferences sharedPref = context.getSharedPreferences("DisciplinearWidgetPref", Context.MODE_PRIVATE);
        int pct = sharedPref.getInt("pct", 0);
        int completed = sharedPref.getInt("completed", 0);
        int total = sharedPref.getInt("total", 0);
        int streak = sharedPref.getInt("streak", 0);

        for (int appWidgetId : appWidgetIds) {
            Intent intent = new Intent(context, MainActivity.class);
            PendingIntent pendingIntent = PendingIntent.getActivity(
                context, 
                0, 
                intent, 
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.habit_widget);
            views.setTextViewText(R.id.widget_dopamine_pct, pct + "%");
            views.setTextViewText(R.id.widget_completed_txt, "Habits: " + completed + "/" + total);
            views.setTextViewText(R.id.widget_streak_txt, "Streak: " + streak + "d");
            
            // Update progress bar
            views.setProgressBar(R.id.widget_progress_bar, 100, pct, false);

            views.setOnClickPendingIntent(R.id.widget_container, pendingIntent);

            appWidgetManager.updateAppWidget(appWidgetId, views);
        }
    }
}
