import lldb

class Array:
    def __init__(self, frame, array_name, size_name):
        self.array_name = array_name
        self.array_ref = Array.__get_array_ref(frame, array_name)
        self.size = Array.__get_size(frame, size_name)

    def __get_size(frame, size_name):
        size = frame.FindVariable(size_name)
        if not size:
            raise Exception(f"Can't find size variable `{size_name}` in scope.")
        return int(size.GetValue(), 0)

    def __get_array_ref(frame, array_name):
        array_ref = frame.FindVariable(array_name)
        if not array_ref:
            raise Exception(f"Can't find array variable `{array_name}` in scope.")
        return array_ref
    
    def get(self):
        return tuple(int(self.array_ref.GetChildAtIndex(i, lldb.eDynamicCanRunTarget, True).GetValue(), 0) for i in range(self.size))
