from urllib import request

from django.db import models
from django.db.models import Sum
from django.db.models.functions import TruncMonth
from datetime import datetime
from openpyxl import Workbook
from io import BytesIO
from django.http import HttpResponse

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated

from .models import User, Profile, Income, Expense, Budget, SavingsGoal, Notification, Report
from .serializers import UserRegistrationSerializer, ProfileSerializer, IncomeSerializer, ExpenseSerializer, BudgetSerializer, SavingsGoalSerializer, NotificationSerializer, ReportSerializer


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
        profile, _ = Profile.objects.get_or_create(user=request.user)
        return Response({
            'message': 'You are authenticated successfully',
            'username': request.user.username,
            'email': request.user.email,
            'role': request.user.role,
            'monthly_income': profile.monthly_income,
            'financial_preferences': profile.financial_preferences,
        })

    def put(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)

        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        if 'role' in data:
            data.pop('role')

        serializer = ProfileSerializer(
            profile,
            data=data,
            context={'request': request},
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Profile updated successfully',
                'username': request.user.username,
                'email': request.user.email,
                'role': request.user.role,
                'monthly_income': profile.monthly_income,
                'financial_preferences': profile.financial_preferences,
            }, status=status.HTTP_200_OK)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )        
        
class IncomeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, income_id=None):

    # If no specific income ID is given,
    # return all incomes of the logged-in user
        if income_id is None:
            incomes = Income.objects.filter(
              user=request.user
            ).order_by('-income_date', '-id')

            serializer = IncomeSerializer(
              incomes,
              many=True
            )

            return Response(serializer.data)
        
        # If a specific income ID is given,
        # return only that income if it belongs to the logged-in user
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

        serializer = IncomeSerializer(income)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

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
            expense = serializer.save(user=request.user)

            # Check matching monthly or month-specific budget
            expense_month_name = expense.expense_date.strftime("%B")
            budget = Budget.objects.filter(
                user=request.user,
                category=expense.category,
                period__in=["Monthly", expense_month_name]
            ).first()

            if budget:

                # Calculate spending for the same category
                # and same month as the new expense
                total_spending = Expense.objects.filter(
                    user=request.user,
                    category=budget.category,
                    expense_date__year=expense.expense_date.year,
                    expense_date__month=expense.expense_date.month
                ).aggregate(
                    total=models.Sum('amount')
                )['total'] or 0

                # Calculate budget utilization percentage
                utilization = (
                    total_spending / budget.amount
                ) * 100

                notification_type = None
                message = None

                # Budget exceeded/reached
                if utilization >= 100:
                   notification_type = "Budget Limit Alert"
                   message = (
                        f"Your {budget.category} monthly budget of "
                        f"₹{budget.amount} has been reached or exceeded. "
                        f"Current spending: ₹{total_spending} "
                        f"({utilization:.2f}%) "
                        f"for {expense.expense_date.year}-"
                        f"{expense.expense_date.month:02d}."
                    )

        # Budget near limit
                elif utilization >= 80:
                    notification_type = "Budget Near Limit Alert"

                    message = (
                        f"Your {budget.category} monthly budget is near its limit. "
                        f"Budget: ₹{budget.amount}, "
                        f"Current spending: ₹{total_spending} "
                        f"({utilization:.2f}%) "
                        f"for {expense.expense_date.year}-"
                        f"{expense.expense_date.month:02d}."
                    )
            

                # Create notification only when threshold is reached
                if notification_type:
                    month_label = (
                        f"{expense.expense_date.year}-"
                        f"{expense.expense_date.month:02d}"
                    )

                    existing_notification = (
                        Notification.objects.filter(
                            user=request.user,
                            notification_type=notification_type,
                        )
                        .filter(message__contains=budget.category)
                        .filter(message__contains=month_label)
                        .exists()
                    )

                    if not existing_notification:
                        Notification.objects.create(
                            user=request.user,
                            notification_type=notification_type,
                            message=message
                        )

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

    def put(self, request, budget_id):
        try:
            budget = Budget.objects.get(
                id=budget_id,
                user=request.user
            )
        except Budget.DoesNotExist:
            return Response(
                {
                    "error": "Budget not found"
                },
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = BudgetSerializer(
            budget,
            data=request.data,
            partial=True
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

    def delete(self, request, budget_id):
        try:
            budget = Budget.objects.get(
                id=budget_id,
                user=request.user
            )
        except Budget.DoesNotExist:
            return Response(
                {
                    "error": "Budget not found"
                },
                status=status.HTTP_404_NOT_FOUND
            )

        budget.delete()

        return Response(
            {
                "message": "Budget deleted successfully"
            },
            status=status.HTTP_200_OK
        )
    
    
class SavingsGoalView(APIView):
    permission_classes = [IsAuthenticated]

    # Get user's savings goals
    def get(self, request):
        savings_goals = SavingsGoal.objects.filter(
            user=request.user
        )

        serializer = SavingsGoalSerializer(
            savings_goals,
            many=True
        )

        return Response(serializer.data)

    # Create a savings goal
    def post(self, request):
        serializer = SavingsGoalSerializer(
            data=request.data
        )

        if serializer.is_valid():
            savings_goal = serializer.save(
                user=request.user
            )

            return Response(
                SavingsGoalSerializer(savings_goal).data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
       )

    # Update a savings goal
    def put(self, request, goal_id=None):

        try:
            savings_goal = SavingsGoal.objects.get(
                id=goal_id,
                user=request.user
            )

        except SavingsGoal.DoesNotExist:
            return Response(
                {"error": "Savings goal not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = SavingsGoalSerializer(
            savings_goal,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():

            savings_goal = serializer.save()

            # Check savings goal milestone
            if (
                savings_goal.current_amount
                >= savings_goal.target_amount
            ):

               # Prevent duplicate milestone notifications
                existing_notification = Notification.objects.filter(
                   user=request.user,
                   notification_type="Savings Goal Milestone",
                   message__contains=f"Goal ID: {savings_goal.id}"
                ).exists()

                if not existing_notification:
                   Notification.objects.create(
                       user=request.user,
                       notification_type="Savings Goal Milestone",
                       message=(
                            f"Congratulations! You have reached your "
                            f"savings goal '{savings_goal.goal_name}' "
                            f"of ₹{savings_goal.target_amount}. "
                            f"Goal ID: {savings_goal.id}"
                        )
                    ) 
 
            return Response(
                SavingsGoalSerializer(savings_goal).data,
                status=status.HTTP_200_OK
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
    
    
class NotificationView(APIView):
    permission_classes = [IsAuthenticated]

    # Get all notifications
    def get(self, request):
        unread_only = request.query_params.get("unread")
        notifications = Notification.objects.filter(user=request.user).order_by('-created_at')
        if unread_only == "true":
             notifications = notifications.filter(is_read=False)

        notifications = notifications.order_by('-created_at')
        
        serializer = NotificationSerializer(notifications, many=True)

        return Response(serializer.data)

    # Mark notification as read
    def put(self, request, notification_id):
        try:
            notification = Notification.objects.get(
                id=notification_id,
                user=request.user
            )
        except Notification.DoesNotExist:
            return Response(
                {"error": "Notification not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        notification.is_read = True
        notification.save()

        serializer = NotificationSerializer(notification)

        return Response(serializer.data)
    

class ReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        reports = Report.objects.filter(
            user=request.user
        ).order_by('-generated_at')

        report_data = []

        for report in reports:

            # Get report month
            try:
                selected_month = datetime.strptime(
                    report.period,
                    "%Y-%m"
                )
            except ValueError:
                continue

            # Monthly income
            incomes = Income.objects.filter(
                user=request.user,
                income_date__year=selected_month.year,
                income_date__month=selected_month.month
            )

            # Monthly expenses
            expenses = Expense.objects.filter(
                user=request.user,
                expense_date__year=selected_month.year,
                expense_date__month=selected_month.month
            )

            # Calculate totals
            total_income = incomes.aggregate(
                total=Sum("amount")
            )["total"] or 0

            total_expenses = expenses.aggregate(
                total=Sum("amount")
            )["total"] or 0

            savings = total_income - total_expenses

            # Get user's budgets
            budgets = Budget.objects.filter(
                user=request.user
            )

            budget_data = [
                {
                    "category": budget.category,
                    "amount": budget.amount,
                    "period": budget.period
                }
                for budget in budgets
            ]

            report_data.append({
                "id": report.id,
                "report_type": report.report_type,
                "period": report.period,
                "generated_at": report.generated_at,
                "file_reference": report.file_reference,

                "summary": {
                    "total_income": total_income,
                    "total_expenses": total_expenses,
                    "savings": savings
                },

                "budgets": budget_data,

                "expense_count": expenses.count(),
                "income_count": incomes.count()
            })

        return Response(
            report_data,
            status=status.HTTP_200_OK
        )

    def post(self, request):

        # Get requested month
        month = request.data.get("month")

        if not month:
            return Response(
                {"error": "Month is required. Use YYYY-MM."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate month
        try:
            selected_month = datetime.strptime(
                month,
                "%Y-%m"
            )
        except ValueError:
            return Response(
                {"error": "Invalid month format. Use YYYY-MM."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get user's monthly income
        incomes = Income.objects.filter(
            user=request.user,
            income_date__year=selected_month.year,
            income_date__month=selected_month.month
        )

        # Get user's monthly expenses
        expenses = Expense.objects.filter(
            user=request.user,
            expense_date__year=selected_month.year,
            expense_date__month=selected_month.month
        )

        # Calculate totals
        total_income = incomes.aggregate(
            total=Sum("amount")
        )["total"] or 0

        total_expenses = expenses.aggregate(
            total=Sum("amount")
        )["total"] or 0

        savings = total_income - total_expenses

        # Get user's budgets
        budgets = Budget.objects.filter(
            user=request.user
        )

        # Create report record
        report = Report.objects.create(
            user=request.user,
            report_type="Monthly Financial Report",
            period=month,
            file_reference=f"BudgetBuddy_{month}.xlsx"
        )

        # Create notification
        Notification.objects.create(
            user=request.user,
            notification_type="Monthly Report Generated",
            message=(
                f"Your monthly financial report for {month} "
                f"has been generated successfully."
            )
        )

        # Return JSON response
        return Response(
            {
                "message": "Monthly report generated successfully.",
                "report": {
                    "id": report.id,
                    "report_type": report.report_type,
                    "period": report.period,
                    "generated_at": report.generated_at,
                    "file_reference": report.file_reference,

                    "summary": {
                        "total_income": total_income,
                        "total_expenses": total_expenses,
                        "savings": savings
                    },

                    "expense_count": expenses.count(),
                    "income_count": incomes.count(),
                    "budget_count": budgets.count()
                }
            },
            status=status.HTTP_201_CREATED
        )

    def excel(self, request, report_id):

        # Get only the logged-in user's report
        try:
            report = Report.objects.get(
                id=report_id,
                user=request.user
            )
        except Report.DoesNotExist:
            return Response(
                {"error": "Report not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Validate report month
        try:
            selected_month = datetime.strptime(
                report.period,
                "%Y-%m"
            )
        except ValueError:
            return Response(
                {"error": "Invalid report period"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get user's monthly income
        incomes = Income.objects.filter(
            user=request.user,
            income_date__year=selected_month.year,
            income_date__month=selected_month.month
        )

        # Get user's monthly expenses
        expenses = Expense.objects.filter(
            user=request.user,
            expense_date__year=selected_month.year,
            expense_date__month=selected_month.month
        )

        # Get user's budgets
        budgets = Budget.objects.filter(
            user=request.user
        )

        # Calculate totals
        total_income = incomes.aggregate(
            total=Sum("amount")
        )["total"] or 0

        total_expenses = expenses.aggregate(
            total=Sum("amount")
        )["total"] or 0

        savings = total_income - total_expenses

        # Create Excel workbook
        workbook = Workbook()
        worksheet = workbook.active
        worksheet.title = "Monthly Report"

        # Report information
        worksheet["A1"] = "BudgetBuddy - Monthly Financial Report"
        worksheet["A2"] = f"User: {request.user.username}"
        worksheet["A3"] = f"Period: {report.period}"

        # Financial summary
        worksheet["A5"] = "Financial Summary"

        worksheet["A6"] = "Total Income"
        worksheet["B6"] = float(total_income)

        worksheet["A7"] = "Total Expenses"
        worksheet["B7"] = float(total_expenses)

        worksheet["A8"] = "Savings"
        worksheet["B8"] = float(savings)

        # Expenses
        worksheet["A10"] = "Expenses"

        worksheet["A11"] = "Title"
        worksheet["B11"] = "Amount"
        worksheet["C11"] = "Category"
        worksheet["D11"] = "Date"
        worksheet["E11"] = "Description"

        row = 12

        for expense in expenses.order_by(
            "expense_date",
            "id"
        ):
            worksheet.cell(
                row=row,
                column=1,
                value=expense.title
            )

            worksheet.cell(
                row=row,
                column=2,
                value=float(expense.amount)
            )

            worksheet.cell(
                row=row,
                column=3,
                value=expense.category
            )

            worksheet.cell(
                row=row,
                column=4,
                value=str(expense.expense_date)
            )

            worksheet.cell(
                row=row,
                column=5,
                value=expense.description or ""
            )

            row += 1

        # Income
        row += 2

        worksheet.cell(
            row=row,
            column=1,
            value="Income"
        )

        row += 1

        worksheet.cell(
            row=row,
            column=1,
            value="Source"
        )

        worksheet.cell(
            row=row,
            column=2,
            value="Amount"
        )

        worksheet.cell(
            row=row,
            column=3,
            value="Date"
        )

        worksheet.cell(
            row=row,
            column=4,
            value="Description"
        )

        row += 1

        for income in incomes.order_by(
            "income_date",
            "id"
        ):
            worksheet.cell(
                row=row,
                column=1,
                value=income.source
            )

            worksheet.cell(
                row=row,
                column=2,
                value=float(income.amount)
            )

            worksheet.cell(
                row=row,
                column=3,
                value=str(income.income_date)
            )

            worksheet.cell(
                row=row,
                column=4,
                value=income.description or ""
            )

            row += 1

        # Budgets
        row += 2

        worksheet.cell(
            row=row,
            column=1,
            value="Budgets"
        )

        row += 1

        worksheet.cell(
            row=row,
            column=1,
            value="Category"
        )

        worksheet.cell(
            row=row,
            column=2,
            value="Amount"
        )

        worksheet.cell(
            row=row,
            column=3,
            value="Period"
        )

        row += 1

        for budget in budgets:
            worksheet.cell(
                row=row,
                column=1,
                value=budget.category
            )

            worksheet.cell(
                row=row,
                column=2,
                value=float(budget.amount)
            )

            worksheet.cell(
                row=row,
                column=3,
                value=budget.period
            )

            row += 1

        # Column widths
        worksheet.column_dimensions["A"].width = 30
        worksheet.column_dimensions["B"].width = 18
        worksheet.column_dimensions["C"].width = 20
        worksheet.column_dimensions["D"].width = 18
        worksheet.column_dimensions["E"].width = 35

        # Save workbook in memory
        excel_file = BytesIO()

        workbook.save(excel_file)

        excel_file.seek(0)

        # Return Excel file
        response = HttpResponse(
            excel_file.getvalue(),
            content_type=(
                "application/vnd.openxmlformats-officedocument."
                "spreadsheetml.sheet"
            )
        )
        

        response["Content-Disposition"] = (
            f'attachment; filename="BudgetBuddy_{report.period}.xlsx"'
        )

        return response

from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors


class ReportExcelView(ReportView):
    def get(self, request, report_id):
        return self.excel(request, report_id)


class ReportPDFView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, report_id):
        try:
            report = Report.objects.get(
                id=report_id,
                user=request.user
            )
        except Report.DoesNotExist:
            return Response(
                {"error": "Report not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            selected_month = datetime.strptime(
                report.period,
                "%Y-%m"
            )
        except ValueError:
            return Response(
                {"error": "Invalid report period"},
                status=status.HTTP_400_BAD_REQUEST
            )

        incomes = Income.objects.filter(
            user=request.user,
            income_date__year=selected_month.year,
            income_date__month=selected_month.month
        ).order_by("income_date", "id")

        expenses = Expense.objects.filter(
            user=request.user,
            expense_date__year=selected_month.year,
            expense_date__month=selected_month.month
        ).order_by("expense_date", "id")

        budgets = Budget.objects.filter(
            user=request.user
        )

        total_income = incomes.aggregate(
            total=Sum("amount")
        )["total"] or 0

        total_expenses = expenses.aggregate(
            total=Sum("amount")
        )["total"] or 0

        savings = total_income - total_expenses

        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )
        story = []

        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Heading1'],
            fontSize=22,
            leading=26,
            textColor=colors.HexColor('#0f172a'),
            fontName='Helvetica-Bold'
        )

        subtitle_style = ParagraphStyle(
            'DocSubTitle',
            parent=styles['Heading2'],
            fontSize=13,
            leading=16,
            textColor=colors.HexColor('#0284c7'),
            fontName='Helvetica-Bold'
        )

        section_heading_style = ParagraphStyle(
            'SectionHeading',
            parent=styles['Heading3'],
            fontSize=13,
            leading=17,
            textColor=colors.HexColor('#1e293b'),
            fontName='Helvetica-Bold',
            spaceAfter=6
        )

        normal_style = ParagraphStyle(
            'DocNormal',
            parent=styles['Normal'],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#334155')
        )

        bold_style = ParagraphStyle(
            'DocBold',
            parent=styles['Normal'],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#0f172a'),
            fontName='Helvetica-Bold'
        )

        # Header Section
        story.append(Paragraph("BudgetBuddy", title_style))
        story.append(Paragraph("Monthly Financial Report", subtitle_style))
        story.append(Spacer(1, 10))

        gen_date_str = report.generated_at.strftime('%d %b %Y, %H:%M') if report.generated_at else "-"

        info_data = [
            [Paragraph(f"<b>Username:</b> {request.user.username}", normal_style),
             Paragraph(f"<b>Period:</b> {report.period}", normal_style)],
            [Paragraph(f"<b>Generated Date:</b> {gen_date_str}", normal_style),
             Paragraph(f"<b>Report ID:</b> #{report.id}", normal_style)]
        ]
        info_table = Table(info_data, colWidths=[270, 270])
        info_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
            ('PADDING', (0, 0), (-1, -1), 8),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        story.append(info_table)
        story.append(Spacer(1, 15))

        # Financial Summary Section
        story.append(Paragraph("Financial Summary", section_heading_style))
        summary_data = [
            [Paragraph("<b>Metric</b>", bold_style), Paragraph("<b>Amount (₹)</b>", bold_style)],
            [Paragraph("Total Income", normal_style), Paragraph(f"₹{total_income:,.2f}", bold_style)],
            [Paragraph("Total Expenses", normal_style), Paragraph(f"₹{total_expenses:,.2f}", bold_style)],
            [Paragraph("Net Savings", normal_style), Paragraph(f"₹{savings:,.2f}", bold_style)]
        ]
        summary_table = Table(summary_data, colWidths=[270, 270])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (1, 0), colors.HexColor('#0f172a')),
            ('TEXTCOLOR', (0, 0), (1, 0), colors.white),
            ('PADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#f1f5f9')),
            ('BACKGROUND', (0, 2), (-1, 2), colors.white),
            ('BACKGROUND', (0, 3), (-1, 3), colors.HexColor('#e0f2fe')),
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 15))

        # Expense History Section
        story.append(Paragraph("Expense History", section_heading_style))
        if expenses.exists():
            exp_data = [[
                Paragraph("<b>Title</b>", bold_style),
                Paragraph("<b>Amount</b>", bold_style),
                Paragraph("<b>Category</b>", bold_style),
                Paragraph("<b>Date</b>", bold_style),
                Paragraph("<b>Description</b>", bold_style)
            ]]
            for exp in expenses:
                exp_data.append([
                    Paragraph(str(exp.title), normal_style),
                    Paragraph(f"₹{exp.amount:,.2f}", normal_style),
                    Paragraph(str(exp.category), normal_style),
                    Paragraph(str(exp.expense_date), normal_style),
                    Paragraph(str(exp.description or "-"), normal_style)
                ])
            exp_table = Table(exp_data, colWidths=[110, 85, 95, 80, 170])
            exp_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#334155')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('PADDING', (0, 0), (-1, -1), 5),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ]))
            story.append(exp_table)
        else:
            story.append(Paragraph("No expenses recorded for this period.", normal_style))
        story.append(Spacer(1, 15))

        # Income History Section
        story.append(Paragraph("Income History", section_heading_style))
        if incomes.exists():
            inc_data = [[
                Paragraph("<b>Source</b>", bold_style),
                Paragraph("<b>Amount</b>", bold_style),
                Paragraph("<b>Date</b>", bold_style),
                Paragraph("<b>Description</b>", bold_style)
            ]]
            for inc in incomes:
                inc_data.append([
                    Paragraph(str(inc.source), normal_style),
                    Paragraph(f"₹{inc.amount:,.2f}", normal_style),
                    Paragraph(str(inc.income_date), normal_style),
                    Paragraph(str(inc.description or "-"), normal_style)
                ])
            inc_table = Table(inc_data, colWidths=[140, 100, 100, 200])
            inc_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0369a1')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('PADDING', (0, 0), (-1, -1), 5),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ]))
            story.append(inc_table)
        else:
            story.append(Paragraph("No income recorded for this period.", normal_style))
        story.append(Spacer(1, 15))

        # Budget Details Section
        story.append(Paragraph("Budget Details", section_heading_style))
        if budgets.exists():
            bud_data = [[
                Paragraph("<b>Category</b>", bold_style),
                Paragraph("<b>Amount</b>", bold_style),
                Paragraph("<b>Period</b>", bold_style)
            ]]
            for b in budgets:
                bud_data.append([
                    Paragraph(str(b.category), normal_style),
                    Paragraph(f"₹{b.amount:,.2f}", normal_style),
                    Paragraph(str(b.period), normal_style)
                ])
            bud_table = Table(bud_data, colWidths=[180, 180, 180])
            bud_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e293b')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('PADDING', (0, 0), (-1, -1), 5),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ]))
            story.append(bud_table)
        else:
            story.append(Paragraph("No budget allocation records found.", normal_style))
        story.append(Spacer(1, 20))

        # Footer
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#cbd5e1'), spaceAfter=10))
        footer_style = ParagraphStyle(
            'DocFooter',
            parent=styles['Normal'],
            fontSize=8,
            leading=10,
            textColor=colors.HexColor('#64748b'),
            alignment=1
        )
        story.append(Paragraph("Generated by BudgetBuddy — Student Finance System", footer_style))

        doc.build(story)

        pdf_data = buffer.getvalue()
        buffer.close()

        response = HttpResponse(pdf_data, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="BudgetBuddy_{report.period}.pdf"'
        return response     
        
class ProtectedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "message": f"Hello {request.user.username}, you are authenticated!"
        })
        
        
class AnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        # Logged-in user's data only
        incomes = Income.objects.filter(
            user=request.user
        )

        expenses = Expense.objects.filter(
            user=request.user
        )

        # -----------------------------
        # Date / Month Filtering
        # -----------------------------

        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")
        month = request.query_params.get("month")

        # Month filter: YYYY-MM
        if month:
            try:
                selected_month = datetime.strptime(
                    month,
                    "%Y-%m"
                )

                incomes = incomes.filter(
                    income_date__year=selected_month.year,
                    income_date__month=selected_month.month
                )

                expenses = expenses.filter(
                    expense_date__year=selected_month.year,
                    expense_date__month=selected_month.month
                )

            except ValueError:
                return Response(
                    {
                        "error": "Invalid month format. Use YYYY-MM."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Date range filter
        elif start_date or end_date:

            if start_date:
                try:
                    start = datetime.strptime(
                        start_date,
                        "%Y-%m-%d"
                    ).date()

                except ValueError:
                    return Response(
                        {
                            "error": "Invalid start_date. Use YYYY-MM-DD."
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                incomes = incomes.filter(
                    income_date__gte=start
                )

                expenses = expenses.filter(
                    expense_date__gte=start
                )

            if end_date:
                try:
                    end = datetime.strptime(
                        end_date,
                        "%Y-%m-%d"
                    ).date()

                except ValueError:
                    return Response(
                        {
                            "error": "Invalid end_date. Use YYYY-MM-DD."
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                incomes = incomes.filter(
                    income_date__lte=end
                )

                expenses = expenses.filter(
                    expense_date__lte=end
                )

        # -----------------------------
        # Total Income
        # -----------------------------

        total_income = incomes.aggregate(
            total=Sum("amount")
        )["total"] or 0

        # -----------------------------
        # Total Expenses
        # -----------------------------

        total_expenses = expenses.aggregate(
            total=Sum("amount")
        )["total"] or 0

        # -----------------------------
        # Savings
        # -----------------------------

        savings = total_income - total_expenses

        # -----------------------------
        # Category-wise Expenses
        # -----------------------------

        category_data = expenses.values(
            "category"
        ).annotate(
            total=Sum("amount")
        ).order_by("category")

        category_summary = [
            {
                "category": item["category"],
                "total": item["total"]
            }
            for item in category_data
        ]

        # -----------------------------
        # Monthly Trends
        # -----------------------------

        income_monthly = incomes.annotate(
            month=TruncMonth("income_date")
        ).values(
            "month"
        ).annotate(
            total=Sum("amount")
        ).order_by("month")

        expense_monthly = expenses.annotate(
            month=TruncMonth("expense_date")
        ).values(
            "month"
        ).annotate(
            total=Sum("amount")
        ).order_by("month")

        income_trends = [
            {
                "month": item["month"].strftime("%Y-%m"),
                "total": item["total"]
            }
            for item in income_monthly
        ]

        expense_trends = [
            {
                "month": item["month"].strftime("%Y-%m"),
                "total": item["total"]
            }
            for item in expense_monthly
        ]

        # -----------------------------
        # Final Response
        # -----------------------------

        return Response(
            {
                "summary": {
                    "total_income": total_income,
                    "total_expenses": total_expenses,
                    "savings": savings
                },

                "category_wise_expenses": category_summary,

                "monthly_trends": {
                    "income": income_trends,
                    "expenses": expense_trends
                }
            },
        )
        
    