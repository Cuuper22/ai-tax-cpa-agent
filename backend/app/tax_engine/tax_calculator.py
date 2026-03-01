"""
Production-Grade Tax Calculation Engine
Implements real IRS tax code rules for 2024
"""
from typing import Dict, List, Optional, Any, Tuple
from decimal import Decimal, ROUND_HALF_UP
from datetime import date
from enum import Enum


class FilingStatus(Enum):
    """IRS filing status options"""
    SINGLE = "single"
    MARRIED_JOINT = "married_joint"
    MARRIED_SEPARATE = "married_separate"
    HEAD_OF_HOUSEHOLD = "head_of_household"


class TaxBrackets:
    """2024 Federal Income Tax Brackets (IRS)"""

    # Standard deductions for 2024
    STANDARD_DEDUCTION = {
        FilingStatus.SINGLE: Decimal("14600"),
        FilingStatus.MARRIED_JOINT: Decimal("29200"),
        FilingStatus.MARRIED_SEPARATE: Decimal("14600"),
        FilingStatus.HEAD_OF_HOUSEHOLD: Decimal("21900"),
    }

    # Tax brackets for 2024 - (upper_limit, rate)
    # Format: [(upper_limit, rate), ...] where None means no upper limit
    BRACKETS_2024 = {
        FilingStatus.SINGLE: [
            (Decimal("11600"), Decimal("0.10")),
            (Decimal("47150"), Decimal("0.12")),
            (Decimal("100525"), Decimal("0.22")),
            (Decimal("191950"), Decimal("0.24")),
            (Decimal("243725"), Decimal("0.32")),
            (Decimal("609350"), Decimal("0.35")),
            (None, Decimal("0.37")),  # No upper limit
        ],
        FilingStatus.MARRIED_JOINT: [
            (Decimal("23200"), Decimal("0.10")),
            (Decimal("94300"), Decimal("0.12")),
            (Decimal("201050"), Decimal("0.22")),
            (Decimal("383900"), Decimal("0.24")),
            (Decimal("487450"), Decimal("0.32")),
            (Decimal("731200"), Decimal("0.35")),
            (None, Decimal("0.37")),
        ],
        FilingStatus.MARRIED_SEPARATE: [
            (Decimal("11600"), Decimal("0.10")),
            (Decimal("47150"), Decimal("0.12")),
            (Decimal("100525"), Decimal("0.22")),
            (Decimal("191950"), Decimal("0.24")),
            (Decimal("243725"), Decimal("0.32")),
            (Decimal("365600"), Decimal("0.35")),
            (None, Decimal("0.37")),
        ],
        FilingStatus.HEAD_OF_HOUSEHOLD: [
            (Decimal("16550"), Decimal("0.10")),
            (Decimal("63100"), Decimal("0.12")),
            (Decimal("100500"), Decimal("0.22")),
            (Decimal("191950"), Decimal("0.24")),
            (Decimal("243700"), Decimal("0.32")),
            (Decimal("609350"), Decimal("0.35")),
            (None, Decimal("0.37")),
        ],
    }


class TaxCalculator:
    """Production-grade tax calculation engine"""

    # Legal disclaimer text
    LEGAL_DISCLAIMER = """
⚠️ DISCLAIMER: This is a demo application for educational purposes only.
It does not constitute real tax, legal, or financial advice.
Consult a qualified CPA or tax professional for actual tax preparation and advice.
"""

    def __init__(self, tax_year: int = 2024):
        self.tax_year = tax_year
        self.calculations_log: List[str] = []

        if tax_year != 2024:
            raise ValueError(f"Only 2024 tax year is currently supported, got {tax_year}")

    def calculate_individual_tax(
        self,
        gross_income: Decimal,
        filing_status: str,
        itemized_deductions: Optional[Decimal] = None,
        dependents: int = 0,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Calculate individual income tax (Form 1040) using real IRS brackets

        Args:
            gross_income: Total gross income
            filing_status: One of 'single', 'married_joint', 'married_separate', 'head_of_household'
            itemized_deductions: Optional itemized deductions (if None, uses standard deduction)
            dependents: Number of dependents
            **kwargs: Additional parameters for future enhancements

        Returns:
            Dict with tax calculation details including disclaimer
        """
        self.calculations_log = []

        # Input validation
        if gross_income < 0:
            raise ValueError("Gross income cannot be negative")

        # Parse filing status
        try:
            status = FilingStatus(filing_status.lower())
        except ValueError:
            raise ValueError(
                f"Invalid filing status: {filing_status}. "
                f"Must be one of: {', '.join([s.value for s in FilingStatus])}"
            )

        self.calculations_log.append(f"Filing Status: {status.value}")
        self.calculations_log.append(f"Gross Income: ${gross_income:,.2f}")

        # Determine deduction
        standard_deduction = TaxBrackets.STANDARD_DEDUCTION[status]
        if itemized_deductions is not None:
            if itemized_deductions < 0:
                raise ValueError("Itemized deductions cannot be negative")
            deduction = max(itemized_deductions, standard_deduction)
            deduction_type = "Itemized" if itemized_deductions > standard_deduction else "Standard"
        else:
            deduction = standard_deduction
            deduction_type = "Standard"

        self.calculations_log.append(f"{deduction_type} Deduction: ${deduction:,.2f}")

        # Calculate taxable income
        taxable_income = max(Decimal("0"), gross_income - deduction)
        self.calculations_log.append(f"Taxable Income: ${taxable_income:,.2f}")

        # Calculate tax using progressive brackets
        tax_liability, bracket_details = self._calculate_progressive_tax(
            taxable_income, status
        )

        # Round to cents
        tax_liability = tax_liability.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        self.calculations_log.append(f"Total Tax Liability: ${tax_liability:,.2f}")

        # Calculate effective tax rate
        effective_rate = (tax_liability / gross_income * 100) if gross_income > 0 else Decimal("0")
        effective_rate = effective_rate.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        return {
            "disclaimer": self.LEGAL_DISCLAIMER.strip(),
            "entity_type": "1040",
            "tax_year": self.tax_year,
            "filing_status": status.value,
            "gross_income": float(gross_income),
            "deduction_type": deduction_type,
            "deduction_amount": float(deduction),
            "taxable_income": float(taxable_income),
            "tax_liability": float(tax_liability),
            "effective_tax_rate": float(effective_rate),
            "bracket_breakdown": bracket_details,
            "calculation_steps": self.calculations_log,
            "dependents": dependents,
        }

    def _calculate_progressive_tax(
        self,
        taxable_income: Decimal,
        status: FilingStatus
    ) -> Tuple[Decimal, List[Dict[str, Any]]]:
        """
        Calculate tax using progressive bracket system

        Returns:
            (total_tax, bracket_details)
        """
        brackets = TaxBrackets.BRACKETS_2024[status]
        total_tax = Decimal("0")
        bracket_details = []
        previous_limit = Decimal("0")
        remaining_income = taxable_income

        for upper_limit, rate in brackets:
            if remaining_income <= 0:
                break

            # Determine income in this bracket
            if upper_limit is None:
                # Top bracket - all remaining income
                bracket_income = remaining_income
                bracket_upper = "∞"
            else:
                bracket_income = min(remaining_income, upper_limit - previous_limit)
                bracket_upper = f"${upper_limit:,.0f}"

            # Calculate tax for this bracket
            bracket_tax = bracket_income * rate
            total_tax += bracket_tax

            # Log calculation
            rate_pct = float(rate * 100)
            self.calculations_log.append(
                f"  {rate_pct}% bracket (${previous_limit:,.0f} - {bracket_upper}): "
                f"${bracket_income:,.2f} × {rate_pct}% = ${bracket_tax:,.2f}"
            )

            # Store bracket details
            bracket_details.append({
                "rate": float(rate * 100),
                "lower_limit": float(previous_limit),
                "upper_limit": float(upper_limit) if upper_limit else None,
                "income_in_bracket": float(bracket_income),
                "tax_in_bracket": float(bracket_tax),
            })

            remaining_income -= bracket_income
            previous_limit = upper_limit if upper_limit else previous_limit

        return total_tax, bracket_details

    def calculate_corporate_tax(
        self,
        net_income: Decimal,
        entity_type: str = "C-Corp",
        **kwargs
    ) -> Dict[str, Any]:
        """
        Calculate corporate income tax (Form 1120)

        Args:
            net_income: Net taxable income
            entity_type: Type of corporation

        Returns:
            Dict with tax calculation details
        """
        if net_income < 0:
            raise ValueError("Net income cannot be negative")

        # Flat 21% corporate tax rate (Tax Cuts and Jobs Act)
        corporate_rate = Decimal("0.21")
        tax_liability = net_income * corporate_rate
        tax_liability = tax_liability.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        return {
            "disclaimer": self.LEGAL_DISCLAIMER.strip(),
            "entity_type": "1120",
            "tax_year": self.tax_year,
            "net_income": float(net_income),
            "tax_rate": float(corporate_rate * 100),
            "tax_liability": float(tax_liability),
            "calculation_steps": [
                f"Net Income: ${net_income:,.2f}",
                f"Corporate Tax Rate: 21% (flat)",
                f"Tax Liability: ${net_income:,.2f} × 21% = ${tax_liability:,.2f}",
            ],
        }

    def estimate_quarterly_payments(
        self,
        estimated_annual_income: Decimal,
        filing_status: str,
        withholding_to_date: Decimal = Decimal("0"),
    ) -> Dict[str, Any]:
        """
        Calculate estimated quarterly tax payments

        Args:
            estimated_annual_income: Estimated total income for the year
            filing_status: Filing status
            withholding_to_date: Tax already withheld

        Returns:
            Dict with quarterly payment schedule
        """
        if estimated_annual_income < 0:
            raise ValueError("Estimated annual income cannot be negative")
        if withholding_to_date < 0:
            raise ValueError("Withholding cannot be negative")

        # Calculate estimated annual tax
        tax_calc = self.calculate_individual_tax(
            estimated_annual_income,
            filing_status
        )

        estimated_tax = Decimal(str(tax_calc["tax_liability"]))
        remaining_tax = estimated_tax - withholding_to_date

        # Calculate quarterly payments (4 quarters)
        quarterly_payment = remaining_tax / 4
        quarterly_payment = quarterly_payment.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        return {
            "disclaimer": self.LEGAL_DISCLAIMER.strip(),
            "estimated_annual_tax": float(estimated_tax),
            "withholding_to_date": float(withholding_to_date),
            "remaining_tax_due": float(remaining_tax),
            "quarterly_payment": float(quarterly_payment),
            "payment_schedule": [
                {"quarter": "Q1", "due_date": f"{self.tax_year}-04-15", "amount": float(quarterly_payment)},
                {"quarter": "Q2", "due_date": f"{self.tax_year}-06-15", "amount": float(quarterly_payment)},
                {"quarter": "Q3", "due_date": f"{self.tax_year}-09-15", "amount": float(quarterly_payment)},
                {"quarter": "Q4", "due_date": f"{self.tax_year + 1}-01-15", "amount": float(quarterly_payment)},
            ],
        }

    def get_disclaimer(self) -> str:
        """Get the legal disclaimer text"""
        return self.LEGAL_DISCLAIMER.strip()
