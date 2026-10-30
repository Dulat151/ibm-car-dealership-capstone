from django.db import models
from django.core.validators import MaxValueValidator, MinValueValidator


class CarMake(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class CarModel(models.Model):
    SEDAN = "Sedan"
    SUV = "SUV"
    WAGON = "Wagon"
    COUPE = "Coupe"
    HATCHBACK = "Hatchback"
    OTHER = "Other"

    CAR_TYPES = [
        (SEDAN, "Sedan"),
        (SUV, "SUV"),
        (WAGON, "Wagon"),
        (COUPE, "Coupe"),
        (HATCHBACK, "Hatchback"),
        (OTHER, "Other"),
    ]

    make = models.ForeignKey(
        CarMake,
        on_delete=models.CASCADE,
        related_name="models"
    )
    name = models.CharField(max_length=100)
    type = models.CharField(
        max_length=20,
        choices=CAR_TYPES,
        default=OTHER
    )
    year = models.IntegerField(
        validators=[
            MinValueValidator(2015),
            MaxValueValidator(2023)
        ]
    )

    def __str__(self):
        return f"{self.make.name} {self.name} ({self.year})"
