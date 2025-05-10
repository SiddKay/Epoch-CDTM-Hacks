import asyncio
import os
import sys

# Add the parent directory of 'routers' to the Python path
# This allows us to import from the 'routers' module
# Assuming the test file is in 'backend/' and 'process_image.py' is in 'backend/routers/'
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from routers.process_image import generate_combined_medical_summary_md
except ImportError:
    print("Failed to import generate_combined_medical_summary_md.")
    print("Ensure that the test file is in the 'backend' directory and process_image.py is in 'backend/routers/'.")
    print(f"Current sys.path: {sys.path}")
    generate_combined_medical_summary_md = None # Assign to None to avoid NameError later if import fails

async def main():
    if generate_combined_medical_summary_md is None:
        print("Skipping test as generate_combined_medical_summary_md could not be imported.")
        return

    print("Testing generate_combined_medical_summary_md function...")
    
    # Placeholder text - replace with more specific test data as needed
    placeholder_medical_text = (
        "Patient Name: John Doe. Age: 45. Visited: 2024-07-15.\n"
        "Anamnese: Patient reports persistent cough for 2 weeks, mild fever, and fatigue. No known allergies.\n"
        "Befund: Lungs clear on auscultation. Throat slightly red. Temperature: 37.8°C. BP: 120/80 mmHg.\n"
        "Diagnosen: Suspected upper respiratory tract infection.\n"
        "Procedere: Prescribed rest and hydration. Advised to monitor symptoms. Swab taken for flu test.\n"
        "Leistung: Consultation, basic examination, flu test.\n"
        "Folgetermin: Follow-up in 3 days if symptoms persist or worsen.\n\n"
        "--- Document Separator ---\n\n"
        "Patient Name: John Doe. Lab Report. Date: 2024-07-16.\n"
        "Blood Test Results:\n"
        "WBC: 11.5 x 10^9/L (Ref: 4.0-11.0)\n"
        "RBC: 4.8 x 10^12/L (Ref: 4.5-5.5)\n"
        "Hemoglobin: 14 g/dL (Ref: 13.5-17.5)\n"
        "Platelets: 250 x 10^9/L (Ref: 150-400)\n"
        "Flu Test: Negative."
    )
    
    print("\n--- Input Text ---")
    print(placeholder_medical_text)
    
    # Ensure OPENAI_API_KEY is set, otherwise the function will print a warning/fail.
    if not os.getenv("OPENAI_API_KEY"):
        print("\nWARNING: OPENAI_API_KEY is not set. The LLM call might fail.")
        print("Please set the OPENAI_API_KEY environment variable before running this test.")
        # You might want to skip the call or mock it if the key is not present
        # return 

    print("\n--- Calling LLM for Summary (this may take a moment) ---")
    try:
        summary_md = await generate_combined_medical_summary_md(placeholder_medical_text)
        print("\n--- Generated Markdown Summary ---")
        print(summary_md)
    except Exception as e:
        print(f"\n--- Error during test execution ---")
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    # Check if OPENAI_API_KEY is set and print a general warning if not.
    if not os.getenv("OPENAI_API_KEY"):
        print("---------------------------------------------------------------------------")
        print("WARNING: The OPENAI_API_KEY environment variable is not set.")
        print("The test will attempt to run, but the LLM call is likely to fail.")
        print("Please set this environment variable for the test to function correctly.")
        print("---------------------------------------------------------------------------")
    
    asyncio.run(main()) 