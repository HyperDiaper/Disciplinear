package com.antinity.disciplinear;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.widget.RemoteViews;

public class HabitsListWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        SharedPreferences sharedPref = context.getSharedPreferences("DisciplinearWidgetPref", Context.MODE_PRIVATE);
        int pct = sharedPref.getInt("pct", 0);
        int streak = sharedPref.getInt("streak", 0);

        for (int appWidgetId : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.habits_list_widget);
            
            // Set stats header
            views.setTextViewText(R.id.widget_stats_txt, "Completions: " + pct + "%  •  Streak: " + streak + "d");

            // Set up RemoteViewsService adapter
            Intent serviceIntent = new Intent(context, HabitsWidgetService.class);
            serviceIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
            serviceIntent.setData(Uri.parse(serviceIntent.toUri(Intent.URI_INTENT_SCHEME)));
            views.setRemoteAdapter(R.id.widget_habits_list, serviceIntent);

            // Bind empty view
            views.setEmptyView(R.id.widget_habits_list, R.id.widget_empty_view);

            // Set up pending intent template for click actions
            Intent clickIntent = new Intent(context, MainActivity.class);
            // Must use FLAG_MUTABLE so the fill-in intent can enrich this intent with habit_id
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
                flags |= PendingIntent.FLAG_MUTABLE;
            }
            PendingIntent clickPendingIntent = PendingIntent.getActivity(
                context,
                1,
                clickIntent,
                flags
            );
            views.setPendingIntentTemplate(R.id.widget_habits_list, clickPendingIntent);

            // Notify manager to update the widget
            appWidgetManager.updateAppWidget(appWidgetId, views);
        }
    }
}
