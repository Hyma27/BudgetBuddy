from rest_framework import serializers
from .models import User, Profile, Income, Expense, Budget, SavingsGoal, Notification, Report


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'username',
            'email',
            'password',
        ]

    def create(self, validated_data):
        password = validated_data.pop('password')
        validated_data.pop('role', None)

        user = User(**validated_data)
        user.role = 'student'

        user.set_password(password)

        user.save()

        return user


class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', required=True)
    email = serializers.EmailField(source='user.email', required=True)
    role = serializers.CharField(source='user.role', read_only=True)

    class Meta:
        model = Profile
        fields = [
            'username',
            'email',
            'role',
            'monthly_income',
            'financial_preferences',
        ]

    def validate_username(self, value):
        val = value.strip() if value else ""
        if not val:
            raise serializers.ValidationError("Username is required.")
        user = self.context['request'].user
        if User.objects.filter(username=val).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("A user with that username already exists.")
        return val

    def validate_email(self, value):
        val = value.strip() if value else ""
        if not val:
            raise serializers.ValidationError("Email is required.")
        user = self.context['request'].user
        if User.objects.filter(email=val).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("A user with that email already exists.")
        return val

    def validate_monthly_income(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Monthly income cannot be negative.")
        return value

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        user = instance.user

        if 'username' in user_data and user_data['username']:
            user.username = user_data['username']
        if 'email' in user_data and user_data['email']:
            user.email = user_data['email']
        user.save()

        if 'monthly_income' in validated_data:
            instance.monthly_income = validated_data['monthly_income']
        if 'financial_preferences' in validated_data:
            instance.financial_preferences = validated_data['financial_preferences']
        instance.save()

        return instance


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
        fields = [
            'id',
            'amount',
            'category',
            'period',
        ]


class SavingsGoalSerializer(serializers.ModelSerializer):

    class Meta:
        model = SavingsGoal
        fields = '__all__'
        extra_kwargs={
            'user':{
                'read_only':True
                }
            }


class NotificationSerializer(serializers.ModelSerializer):

    class Meta:
        model = Notification
        fields = '__all__'

class ReportSerializer(serializers.ModelSerializer):

    class Meta:
        model = Report
        fields = '__all__'