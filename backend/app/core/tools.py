from langchain_core.tools import tool
from datetime import datetime, timedelta

@tool
def calculate_deadline(start_date_str: str, days: int, is_business_days: bool = True) -> str:
    """
    Calcula una fecha de vencimiento sumando días a una fecha de inicio.
    Entrada: 
    - start_date_str: 'YYYY-MM-DD'
    - days: cantidad de días a sumar.
    - is_business_days: True para saltar fines de semana, False para días corridos.
    """
    try:
        current_date = datetime.strptime(start_date_str, "%Y-%m-%d")
        
        if not is_business_days:
            final_date = current_date + timedelta(days=days)
        else:
            added_days = 0
            final_date = current_date
            while added_days < days:
                final_date += timedelta(days=1)
                if final_date.weekday() < 5:
                    added_days += 1
                
        return final_date.strftime("%Y-%m-%d")
    except Exception as e:
        return f"Error: {str(e)}"