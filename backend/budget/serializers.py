from rest_framework import serializers
from .models import User, Income, Expense,Budget,SavingsGoal,Notification,Report


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'username',
            'email',
            'password',
            'role'
        ]

    def create(self, validated_data):
        password = validated_data.pop('password')

        user = User(**validated_data)

        user.set_password(password)

        user.save()

        return user
    
    
from .models import Income


class IncomeSerializer(serializers.ModelSerializer):

    class Meta:
        model = Income
        fields = [
            'id',
            'source',
            'amount',
            'income_date',
            'description'
        ]
        
        
class ExpenseSerializer(serializers.ModelSerializer):

    class Meta:
        model = Expense
        fields = [
            'id',
            'title',
            'amount',
            'category',
            'expense_date',
            'description'
        ]    
        
        
class BudgetSerializer(serializers.ModelSerializer):

    class Meta:
        model = Budget
        fields = '__all__'
        

class SavingsGoalSerializer(serializers.ModelSerializer):

    class Meta:
        model = SavingsGoal
        fields = '__all__'
        
        
class NotificationSerializer(serializers.ModelSerializer):

    class Meta:
        model = Notification
        fields = '__all__'
        
class ReportSerializer(serializers.ModelSerializer):

    class Meta:
        model = Report
        fields = '__all__'