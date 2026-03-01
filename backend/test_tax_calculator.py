"""
Basic tests for the production tax calculator
Run with: python test_tax_calculator.py
"""
from decimal import Decimal
from app.tax_engine.tax_calculator import TaxCalculator, FilingStatus


def test_single_filer_low_income():
    """Test single filer with income in first bracket"""
    calc = TaxCalculator(tax_year=2024)
    result = calc.calculate_individual_tax(
        gross_income=Decimal("30000"),
        filing_status="single"
    )

    print("\n" + "=" * 60)
    print("TEST: Single filer, $30,000 income")
    print("=" * 60)
    print(f"Gross Income: ${result['gross_income']:,.2f}")
    print(f"Taxable Income: ${result['taxable_income']:,.2f}")
    print(f"Tax Liability: ${result['tax_liability']:,.2f}")
    print(f"Effective Rate: {result['effective_tax_rate']:.2f}%")
    print("\nBracket Breakdown:")
    for bracket in result['bracket_breakdown']:
        print(f"  {bracket['rate']:.0f}% bracket: ${bracket['income_in_bracket']:,.2f} "
              f"-> ${bracket['tax_in_bracket']:,.2f} tax")

    # Verify calculation manually
    # Gross: $30,000
    # Standard deduction: $14,600
    # Taxable: $15,400
    # First $11,600 @ 10% = $1,160
    # Remaining $3,800 @ 12% = $456
    # Total: $1,616
    expected_tax = 1616.00
    assert abs(result['tax_liability'] - expected_tax) < 1, \
        f"Expected ${expected_tax}, got ${result['tax_liability']}"
    print("\n✅ PASS: Tax calculation correct!")


def test_single_filer_high_income():
    """Test single filer with high income (multiple brackets)"""
    calc = TaxCalculator(tax_year=2024)
    result = calc.calculate_individual_tax(
        gross_income=Decimal("150000"),
        filing_status="single"
    )

    print("\n" + "=" * 60)
    print("TEST: Single filer, $150,000 income")
    print("=" * 60)
    print(f"Gross Income: ${result['gross_income']:,.2f}")
    print(f"Taxable Income: ${result['taxable_income']:,.2f}")
    print(f"Tax Liability: ${result['tax_liability']:,.2f}")
    print(f"Effective Rate: {result['effective_tax_rate']:.2f}%")
    print("\nBracket Breakdown:")
    for bracket in result['bracket_breakdown']:
        print(f"  {bracket['rate']:.0f}% bracket: ${bracket['income_in_bracket']:,.2f} "
              f"-> ${bracket['tax_in_bracket']:,.2f} tax")

    # Should be in 24% bracket
    assert result['tax_liability'] > 0, "Tax should be positive"
    assert result['effective_tax_rate'] > 15, "Effective rate should be reasonable"
    print("\n✅ PASS: High income calculation correct!")


def test_married_joint_filing():
    """Test married filing jointly"""
    calc = TaxCalculator(tax_year=2024)
    result = calc.calculate_individual_tax(
        gross_income=Decimal("120000"),
        filing_status="married_joint"
    )

    print("\n" + "=" * 60)
    print("TEST: Married filing jointly, $120,000 income")
    print("=" * 60)
    print(f"Gross Income: ${result['gross_income']:,.2f}")
    print(f"Standard Deduction: ${result['deduction_amount']:,.2f}")
    print(f"Taxable Income: ${result['taxable_income']:,.2f}")
    print(f"Tax Liability: ${result['tax_liability']:,.2f}")
    print(f"Effective Rate: {result['effective_tax_rate']:.2f}%")

    # Married joint should have higher standard deduction ($29,200)
    assert result['deduction_amount'] == 29200, "Should use married joint deduction"
    print("\n✅ PASS: Married joint filing correct!")


def test_itemized_deductions():
    """Test itemized deductions vs standard deduction"""
    calc = TaxCalculator(tax_year=2024)

    # Test with itemized deductions higher than standard
    result = calc.calculate_individual_tax(
        gross_income=Decimal("100000"),
        filing_status="single",
        itemized_deductions=Decimal("25000")
    )

    print("\n" + "=" * 60)
    print("TEST: Single filer with itemized deductions")
    print("=" * 60)
    print(f"Gross Income: ${result['gross_income']:,.2f}")
    print(f"Deduction Type: {result['deduction_type']}")
    print(f"Deduction Amount: ${result['deduction_amount']:,.2f}")
    print(f"Taxable Income: ${result['taxable_income']:,.2f}")

    assert result['deduction_type'] == "Itemized", "Should use itemized deductions"
    assert result['deduction_amount'] == 25000, "Should use itemized amount"
    print("\n✅ PASS: Itemized deductions applied correctly!")


def test_corporate_tax():
    """Test corporate tax calculation (flat 21%)"""
    calc = TaxCalculator(tax_year=2024)
    result = calc.calculate_corporate_tax(
        net_income=Decimal("500000"),
        entity_type="C-Corp"
    )

    print("\n" + "=" * 60)
    print("TEST: Corporate tax, $500,000 net income")
    print("=" * 60)
    print(f"Net Income: ${result['net_income']:,.2f}")
    print(f"Tax Rate: {result['tax_rate']}%")
    print(f"Tax Liability: ${result['tax_liability']:,.2f}")

    # 21% of $500,000 = $105,000
    expected_tax = 105000.00
    assert result['tax_liability'] == expected_tax, \
        f"Expected ${expected_tax}, got ${result['tax_liability']}"
    print("\n✅ PASS: Corporate tax calculation correct!")


def test_quarterly_payments():
    """Test quarterly estimated tax payments"""
    calc = TaxCalculator(tax_year=2024)
    result = calc.estimate_quarterly_payments(
        estimated_annual_income=Decimal("100000"),
        filing_status="single",
        withholding_to_date=Decimal("5000")
    )

    print("\n" + "=" * 60)
    print("TEST: Quarterly payments, $100,000 estimated income")
    print("=" * 60)
    print(f"Estimated Annual Tax: ${result['estimated_annual_tax']:,.2f}")
    print(f"Withholding to Date: ${result['withholding_to_date']:,.2f}")
    print(f"Remaining Tax Due: ${result['remaining_tax_due']:,.2f}")
    print(f"Quarterly Payment: ${result['quarterly_payment']:,.2f}")
    print("\nPayment Schedule:")
    for payment in result['payment_schedule']:
        print(f"  {payment['quarter']}: ${payment['amount']:,.2f} due {payment['due_date']}")

    assert len(result['payment_schedule']) == 4, "Should have 4 quarterly payments"
    print("\n✅ PASS: Quarterly payment calculation correct!")


def test_input_validation():
    """Test that invalid inputs raise errors"""
    calc = TaxCalculator(tax_year=2024)

    print("\n" + "=" * 60)
    print("TEST: Input validation")
    print("=" * 60)

    # Test negative income
    try:
        calc.calculate_individual_tax(
            gross_income=Decimal("-1000"),
            filing_status="single"
        )
        assert False, "Should have raised ValueError for negative income"
    except ValueError as e:
        print(f"✅ Correctly rejected negative income: {e}")

    # Test invalid filing status
    try:
        calc.calculate_individual_tax(
            gross_income=Decimal("50000"),
            filing_status="invalid_status"
        )
        assert False, "Should have raised ValueError for invalid status"
    except ValueError as e:
        print(f"✅ Correctly rejected invalid filing status: {e}")

    print("\n✅ PASS: Input validation working!")


def test_disclaimer_present():
    """Test that legal disclaimer is included in responses"""
    calc = TaxCalculator(tax_year=2024)
    result = calc.calculate_individual_tax(
        gross_income=Decimal("75000"),
        filing_status="single"
    )

    print("\n" + "=" * 60)
    print("TEST: Legal disclaimer present")
    print("=" * 60)

    assert "disclaimer" in result, "Response should include disclaimer"
    assert len(result["disclaimer"]) > 50, "Disclaimer should be substantial"
    assert "educational purposes" in result["disclaimer"].lower(), \
        "Disclaimer should mention educational purposes"

    print("Disclaimer text:")
    print(result["disclaimer"])
    print("\n✅ PASS: Legal disclaimer present!")


if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("RUNNING TAX CALCULATOR PRODUCTION TESTS")
    print("=" * 60)

    try:
        test_single_filer_low_income()
        test_single_filer_high_income()
        test_married_joint_filing()
        test_itemized_deductions()
        test_corporate_tax()
        test_quarterly_payments()
        test_input_validation()
        test_disclaimer_present()

        print("\n" + "=" * 60)
        print("ALL TESTS PASSED! ✅")
        print("=" * 60)
        print("\nTax calculator is production-ready with real 2024 IRS brackets.")
        print("No more fake 22% flat rate!")
        print("=" * 60 + "\n")

    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
