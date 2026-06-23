package com.antinity.disciplinear;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.view.View;
import android.widget.RemoteViews;
import android.widget.RemoteViewsService;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.List;

public class HabitsWidgetService extends RemoteViewsService {
    @Override
    public RemoteViewsFactory onGetViewFactory(Intent intent) {
        return new HabitsRemoteViewsFactory(this.getApplicationContext());
    }
}

class HabitsRemoteViewsFactory implements RemoteViewsService.RemoteViewsFactory {
    private Context mContext;
    private List<JSONObject> mHabitsList = new ArrayList<>();

    public HabitsRemoteViewsFactory(Context context) {
        mContext = context;
    }

    @Override
    public void onCreate() {
        loadData();
    }

    @Override
    public void onDataSetChanged() {
        loadData();
    }

    private void loadData() {
        mHabitsList.clear();
        SharedPreferences sharedPref = mContext.getSharedPreferences("DisciplinearWidgetPref", Context.MODE_PRIVATE);
        String habitsJson = sharedPref.getString("habitsJson", "[]");
        try {
            JSONArray arr = new JSONArray(habitsJson);
            for (int i = 0; i < arr.length(); i++) {
                mHabitsList.add(arr.getJSONObject(i));
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onDestroy() {
        mHabitsList.clear();
    }

    @Override
    public int getCount() {
        return mHabitsList.size();
    }

    @Override
    public RemoteViews getViewAt(int position) {
        if (position < 0 || position >= getCount()) {
            return null;
        }

        RemoteViews views = new RemoteViews(mContext.getPackageName(), R.layout.habit_widget_item);
        try {
            JSONObject habit = mHabitsList.get(position);
            String name = habit.getString("name");
            String emoji = habit.optString("emoji", "✨");
            boolean completed = habit.getBoolean("completed");
            String progressText = habit.optString("progressText", "");

            views.setTextViewText(R.id.widget_item_name, name);
            views.setTextViewText(R.id.widget_item_emoji, emoji);

            if (progressText != null && !progressText.isEmpty()) {
                views.setTextViewText(R.id.widget_item_progress, progressText);
                views.setViewVisibility(R.id.widget_item_progress, View.VISIBLE);
            } else {
                views.setViewVisibility(R.id.widget_item_progress, View.GONE);
            }

            if (completed) {
                views.setImageViewResource(R.id.widget_item_status, R.drawable.widget_checkbox_checked);
            } else {
                views.setImageViewResource(R.id.widget_item_status, R.drawable.widget_checkbox_unchecked);
            }

            // Fill-in Intent for deep-linking
            Intent fillInIntent = new Intent();
            fillInIntent.putExtra("habit_id", habit.optString("id", ""));
            views.setOnClickFillInIntent(R.id.widget_item_container, fillInIntent);

        } catch (JSONException e) {
            e.printStackTrace();
        }

        return views;
    }

    @Override
    public RemoteViews getLoadingView() {
        return null;
    }

    @Override
    public int getViewTypeCount() {
        return 1;
    }

    @Override
    public long getItemId(int position) {
        return position;
    }

    @Override
    public boolean hasStableIds() {
        return true;
    }
}
