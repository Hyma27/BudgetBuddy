from django.urls import path
from .views import RegisterView, LoginView, ProfileView, IncomeView,ExpenseView,BudgetView,SavingsGoalView,AnalyticsView,NotificationView,ReportView,ReportExcelView,ProtectedView


urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('income/', IncomeView.as_view(), name='income'),
    path('income/<int:income_id>/',IncomeView.as_view(),name='income-detail'),
    path('expense/', ExpenseView.as_view(), name='expense'),
    path('expense/<int:expense_id>/', ExpenseView.as_view(), name='expense-detail'),
    path('budget/', BudgetView.as_view(), name='budget'),
    path('savings-goal/', SavingsGoalView.as_view(), name='savings-goal'),
    path('analytics/', AnalyticsView.as_view(), name='analytics'),
    path('savings-goal/<int:goal_id>/',SavingsGoalView.as_view(),name='savings-goal-detail'),
    path('notifications/', NotificationView.as_view(), name='notifications'), 
    path('notifications/<int:notification_id>/', NotificationView.as_view(), name='notification-detail'),
    path('reports/', ReportView.as_view(), name='reports'),
    path('reports/<int:report_id>/excel/',ReportExcelView.as_view(),name='report-excel'),
    path("protected/", ProtectedView.as_view(), name="protected"),
]
