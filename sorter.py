import sys
import time
import json

def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        swapped = False
        for j in range(0, n-i-1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
                swapped = True
        if not swapped:
            break
    return arr

def merge_sort(arr):
    if len(arr) > 1:
        mid = len(arr) // 2
        L = arr[:mid]
        R = arr[mid:]

        merge_sort(L)
        merge_sort(R)

        i = j = k = 0

        while i < len(L) and j < len(R):
            if L[i] < R[j]:
                arr[k] = L[i]
                i += 1
            else:
                arr[k] = R[j]
                j += 1
            k += 1

        while i < len(L):
            arr[k] = L[i]
            i += 1
            k += 1

        while j < len(R):
            arr[k] = R[j]
            j += 1
            k += 1
    return arr

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No input provided"}))
        sys.exit(1)
        
    input_str = sys.argv[1]
    
    try:
        numbers = [int(x.strip()) for x in input_str.split(',') if x.strip()]
    except ValueError:
        print(json.dumps({"error": "Invalid input, must be integers"}))
        sys.exit(1)

    # Copy arrays for each sort
    arr_bubble = list(numbers)
    arr_merge = list(numbers)

    # Bubble sort timing
    start_time = time.perf_counter()
    sorted_bubble = bubble_sort(arr_bubble)
    bubble_time = time.perf_counter() - start_time

    # Merge sort timing
    start_time = time.perf_counter()
    sorted_merge = merge_sort(arr_merge)
    merge_time = time.perf_counter() - start_time

    result = {
        "bubble_time_ms": bubble_time * 1000,
        "merge_time_ms": merge_time * 1000,
        "sorted_array": sorted_bubble
    }

    print(json.dumps(result))
