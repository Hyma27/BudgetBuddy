from django.urls import path
from .views import RegisterView, LoginView, ProfileView, IncomeView,ExpenseView,BudgetView,SavingsGoalView,NotificationView,ReportView,ProtectedView


urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('income/', IncomeView.as_view(), name='income'),
    path('expense/', ExpenseView.as_view(), name='expense'),
    path('budget/', BudgetView.as_view(), name='budget'),
    path('savings-goal/', SavingsGoalView.as_view(), name='savings-goal'),
    path('notifications/', NotificationView.as_view(), name='notifications'), 
    path('reports/', ReportView.as_view(), name='reports'),
    path("protected/", ProtectedView.as_view(), name="protected"),
]
