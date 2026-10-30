import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from .models import CarMake, CarModel
from .restapis import get_request, post_review, analyze_review_sentiments

def body_json(request):
    try:
        return json.loads(request.body.decode("utf-8") or "{}")
    except (UnicodeDecodeError, json.JSONDecodeError):
        return None

@csrf_exempt
def login_user(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)
    data = body_json(request)
    if data is None:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    username = data.get("userName", "")
    user = authenticate(request, username=username, password=data.get("password", ""))
    if user is None:
        return JsonResponse({"userName": username, "status": "Invalid credentials"}, status=401)
    login(request, user)
    return JsonResponse({"userName": user.username, "status": "Authenticated"})

@csrf_exempt
def logout_request(request):
    logout(request)
    return JsonResponse({"userName": ""})

@csrf_exempt
def registration(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)
    data = body_json(request)
    if data is None:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    username = str(data.get("userName", "")).strip()
    password = str(data.get("password", ""))
    email = str(data.get("email", "")).strip()
    if not username or not password:
        return JsonResponse({"error": "Username and password are required"}, status=400)
    if User.objects.filter(username=username).exists():
        return JsonResponse({"error": "Username already exists"}, status=409)
    user = User.objects.create_user(username=username, password=password, email=email)
    return JsonResponse({"userName": user.username, "status": "Registered"}, status=201)

def get_dealerships(request):
    state = request.GET.get("state")
    result = get_request("fetchDealers/" + state if state else "fetchDealers")
    if result is None:
        return JsonResponse({"error": "Dealership service unavailable"}, status=503)
    return JsonResponse(result, safe=False)

def get_dealer_details(request, dealer_id):
    result = get_request(f"fetchDealer/{dealer_id}")
    if result is None:
        return JsonResponse({"error": "Dealer service unavailable"}, status=503)
    if isinstance(result, dict) and result.get("error"):
        return JsonResponse(result, status=404)
    return JsonResponse(result, safe=False)

def get_dealer_reviews(request, dealer_id):
    result = get_request(f"fetchReviews/dealer/{dealer_id}")
    if result is None:
        return JsonResponse({"error": "Review service unavailable"}, status=503)
    return JsonResponse(result, safe=False)

def get_cars(request):
    cars = []
    for model in CarModel.objects.select_related("make").all().order_by("make__name", "name"):
        cars.append({"CarMake": model.make.name, "CarModel": model.name})
    return JsonResponse({"CarModels": cars})

@csrf_exempt
def add_review(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)
    data = body_json(request)
    if data is None:
        data = request.POST.dict()
    if not all(str(data.get(k, "")).strip() for k in ("name", "dealership", "review")):
        return JsonResponse({"error": "Name, dealership and review are required"}, status=400)
    sentiment = analyze_review_sentiments(data["review"])
    saved = post_review(data)
    if saved is None:
        return JsonResponse({"error": "Could not save review", "sentiment": sentiment.get("sentiment", "unavailable")}, status=502)
    return JsonResponse({"review": saved, "sentiment": sentiment.get("sentiment", "unavailable")}, status=201)
