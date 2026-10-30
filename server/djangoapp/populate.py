import json
from pathlib import Path
from .models import CarMake, CarModel

def initiate():
    data_path = Path(__file__).resolve().parent.parent / "database" / "data" / "car_records.json"
    with data_path.open(encoding="utf-8") as f:
        records = json.load(f)["cars"]
    created_models = 0
    for record in records:
        make_name = record["make"].strip()
        make, _ = CarMake.objects.get_or_create(name=make_name)
        raw_type = str(record.get("bodyType", "Other")).strip().lower()
        type_map = {"suv": "SUV", "sedan": "Sedan", "wagon": "Wagon", "coupe": "Coupe",
                    "hatchback": "Hatchback", "convertible": "Other", "pickup": "Other"}
        car_type = type_map.get(raw_type, "Other")
        _, created = CarModel.objects.get_or_create(
            make=make, name=record["model"].strip(), type=car_type, year=record["year"]
        )
        created_models += int(created)
    return {"source_records": len(records), "makes": CarMake.objects.count(),
            "models": CarModel.objects.count(), "new_models": created_models}
