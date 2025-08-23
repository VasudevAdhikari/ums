from PIL import Image, ImageDraw, ImageFont
import os, uuid
from django.conf import settings
from django.core.cache import cache

# Function to wrap text within a specified width
def wrap_text(text, font, max_width, draw):
    words = text.split()
    lines = []
    current_line = ""

    for word in words:
        test_line = current_line + " " + word if current_line else word
        if draw.textlength(test_line, font=font) <= max_width:
            current_line = test_line
        else:
            lines.append(current_line)
            current_line = word
    if current_line:
        lines.append(current_line)
    return lines

def create_result_image_dynamic(courses, student_name, student_id, degree, semester, term):
    # Create a blank image with white background
    width, base_height = 800, 1200
    estimated_height = base_height + len(courses) * 60
    image = Image.new('RGB', (width, estimated_height), 'white')
    draw = ImageDraw.Draw(image)
    
    # Load fonts (use default if specific font not available)
    try:
        title_font = ImageFont.truetype("arialbd.ttf", 36)
        header_font = ImageFont.truetype("arialbd.ttf", 24)
        text_font = ImageFont.truetype("arial.ttf", 20)
        small_font = ImageFont.truetype("arial.ttf", 18)
    except:
        title_font = ImageFont.load_default()
        header_font = ImageFont.load_default()
        text_font = ImageFont.load_default()
        small_font = ImageFont.load_default()

    # University header
    # ============== TO FIX => Replace with original university name========================
    
    draw.text((width/2, 50), cache.get('uni_name_lagjagale'), fill='navy', font=title_font, anchor='mm')
    draw.text((width/2, 120), degree.title(), fill='darkblue', font=header_font, anchor='mm')
    draw.text((width/2, 170), term.title(), fill='darkred', font=header_font, anchor='mm')
    
    # Student info
    y_position = 230
    student_info = {
        "Student Name": student_name,
        "Roll No.": student_id,
        "Degree": degree,
        "Semester": semester,
        "Academic Term": term
    }
    
    for key, value in student_info.items():
        draw.text((100, y_position), f"{key}:", fill='black', font=text_font)
        draw.text((300, y_position), value, fill='black', font=text_font)
        y_position += 40

    y_position += 20
    draw.line((50, y_position, width-50, y_position), fill='black', width=2)

    headers = ["Code", "Course Name", "Got Credits", "Grade", "Points"]
    col_positions = [70, 250, 530, 620, 700]

    for i, header in enumerate(headers):
        draw.text((col_positions[i], y_position + 15), header, fill='black', font=text_font, anchor='mm')
    
    y_position += 50
    draw.line((50, y_position, width-50, y_position), fill='black', width=2)

    # Draw course rows
    for course in courses:
        wrapped_name_lines = wrap_text(course["course_name"], small_font, 250, draw)
        line_height = 25
        max_lines = max(1, len(wrapped_name_lines))

        for i in range(max_lines):
            if i == 0:
                draw.text((col_positions[0], y_position + 10), course["course_code"], fill='black', font=small_font, anchor='mm')
                draw.text((col_positions[2], y_position + 10), str(course["grade_score"]), fill='black', font=small_font, anchor='mm')
                draw.text((col_positions[3], y_position + 10), course["letter_grade"], fill='black', font=small_font, anchor='mm')
                draw.text((col_positions[4], y_position + 10), str(course["grade_point"]), fill='black', font=small_font, anchor='mm')

            draw.text((col_positions[1], y_position + 10 + (i * line_height)), wrapped_name_lines[i], fill='black', font=small_font, anchor='mm')

        y_position += line_height * max_lines
        draw.line((50, y_position, width-50, y_position), fill='gray', width=1)

    # Totals and GPA
    total_credits = sum(course["grade_score"] for course in courses)
    total_points = sum(course["grade_point"] for course in courses)
    gpa = total_points / total_credits if total_credits > 0 else 0

    y_position += 30
    draw.text((450, y_position), "Total :", fill='black', font=text_font)
    draw.text((550, y_position), f"{total_credits} Credits", fill='black', font=text_font)

    y_position += 30
    draw.text((450, y_position), "GPA:", fill='black', font=text_font)
    draw.text((550, y_position), f"{gpa:.2f}", fill='black', font=text_font)

    # Generate unique filename with UUID
    unique_filename = f"result_{uuid.uuid4()}.png"
    
    # Create results directory in media if it doesn't exist
    results_dir = os.path.join(settings.MEDIA_ROOT, 'results')
    if not os.path.exists(results_dir):
        os.makedirs(results_dir)
    
    # Save the image in media/results directory
    file_path = os.path.join(results_dir, unique_filename)
    image.save(file_path)
    
    # Return the URL for the saved image
    image_url = f"results/{unique_filename}"
    return image_url


# Example usage (uncomment to test):
def test():
    course_data = [
        {'course_name': 'Myanmar Language Fundamentals', 'course_code': 'MM 101', 'credits': 4, 'letter_grade': 'F', 'grade_score': 0.0, 'grade_point': 0.0},
        {'course_name': 'Introduction to Information Technology (the overview)', 'course_code': 'CS 201', 'credits': 4, 'letter_grade': 'F', 'grade_score': 0.0, 'grade_point': 0.0},
        {'course_name': 'Discrete Mathematics', 'course_code': 'CM 102', 'credits': 4, 'letter_grade': 'F', 'grade_score': 0.0, 'grade_point': 0.0},
        {'course_name': 'Advanced Microsoft Office Applications', 'course_code': 'ITSM 101', 'credits': 3, 'letter_grade': 'F', 'grade_score': 0.0, 'grade_point': 0.0},
        {'course_name': 'Technical Writing in English', 'course_code': 'Eng 102', 'credits': 3, 'letter_grade': 'F', 'grade_score': 0.0, 'grade_point': 0.0},
        {'course_name': 'Myanmar Literature and Culture', 'course_code': 'MM 201', 'credits': 3, 'letter_grade': 'F', 'grade_score': 0.0, 'grade_point': 0.0},
        {'course_name': 'Communication Skills in Myanmar', 'course_code': 'MM 202', 'credits': 3, 'letter_grade': 'F', 'grade_score': 0.0, 'grade_point': 0.0},
    ]

    # Create image and get URL
    image_url = create_result_image_dynamic(course_data)
    print(f"Generated result image URL: {image_url}")
