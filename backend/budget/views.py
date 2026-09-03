from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated

from .models import User,Income,Expense,Budget,SavingsGoal,Notification,Report
from .serializers import UserRegistrationSerializer,IncomeSerializer,ExpenseSerializer,BudgetSerializer,SavingsGoalSerializer,NotificationSerializer,ReportSerializer


class RegisterView(APIView):

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()

            return Response(
                {
                    'message': 'User registered successfully'
                },
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class LoginView(APIView):

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'error': 'Invalid email or password'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.check_password(password):
            return Response(
                {'error': 'Invalid email or password'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        refresh = RefreshToken.for_user(user)

        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'role': user.role,
        })
        
        
class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            'message': 'You are authenticated successfully',
            'username': request.user.username,
            'email': request.user.email,
            'role': request.user.role,
        })        
        
class IncomeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        incomes = Income.objects.filter(
            user=request.user
        ).order_by('-income_date', '-id')

        serializer = IncomeSerializer(
            incomes,
            many=True
        )

        return Response(serializer.data)

    def post(self, request):
        serializer = IncomeSerializer(
            data=request.data
        )

        if serializer.is_valid():
            serializer.save(user=request.user)

            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
     
    def put(self, request, income_id):
        try:
            income = Income.objects.get(
                id=income_id,
                user=request.user
            )
        except Income.DoesNotExist:
            return Response(
                {
                    "error": "Income not found"
                },
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = IncomeSerializer(
            income,
            data=request.data
        )

        if serializer.is_valid():
            serializer.save()

            return Response(
                serializer.data,
                status=status.HTTP_200_OK
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    def delete(self, request, income_id):
        try:
            income = Income.objects.get(
                id=income_id,
                user=request.user
            )
        except Income.DoesNotExist:
            return Response(
                {
                    "error": "Income not found"
                },
                status=status.HTTP_404_NOT_FOUND
            )

        income.delete()

        return Response(
            {
                "message": "Income deleted successfully"
            },
            status=status.HTTP_200_OK
        )   
class ExpenseView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        expenses = Expense.objects.filter(
            user=request.user
        ).order_by('-expense_date', '-id')

        serializer = ExpenseSerializer(
            expenses,
            many=True
        )

        return Response(serializer.data)

    def post(self, request):
        serializer = ExpenseSerializer(
            data=request.data
        )

        if serializer.is_valid():
            serializer.save(user=request.user)

            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    def put(self, request, expense_id):
        try:
            expense = Expense.objects.get(
                id=expense_id,
                user=request.user
            )
        except Expense.DoesNotExist:
            return Response(
                {
                    "error": "Expense not found"
                },
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ExpenseSerializer(
            expense,
            data=request.data
        )

        if serializer.is_valid():
            serializer.save()

            return Response(
                serializer.data,
                status=status.HTTP_200_OK
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
        
    def delete(self, request, expense_id):
        try:
            expense = Expense.objects.get(
                id=expense_id,
                user=request.user
            )
        except Expense.DoesNotExist:
            return Response(
                {
                    "error": "Expense not found"
                },
                status=status.HTTP_404_NOT_FOUND
            )

        expense.delete()

        return Response(
            {
                "message": "Expense deleted successfully"
            },
            status=status.HTTP_200_OK
        )
        
class BudgetView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        budgets = Budget.objects.filter(
            user=request.user
        ).order_by('-id')

        serializer = BudgetSerializer(
            budgets,
            many=True
        )

        return Response(serializer.data)

    def post(self, request):
        serializer = BudgetSerializer(
            data=request.data
        )

        if serializer.is_valid():
            serializer.save(user=request.user)

            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
    
    
class SavingsGoalView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        savings_goals = SavingsGoal.objects.filter(user=request.user)
        serializer = SavingsGoalSerializer(savings_goals, many=True)

        return Response(serializer.data)
    
    
class NotificationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(user=request.user)
        serializer = NotificationSerializer(notifications, many=True)

        return Response(serializer.data)
    


class ReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        reports = Report.objects.filter(user=request.user)
        serializer = ReportSerializer(reports, many=True)

        return Response(serializer.data)
    
    
class ProtectedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "message": f"Hello {request.user.username}, you are authenticated!"
        })