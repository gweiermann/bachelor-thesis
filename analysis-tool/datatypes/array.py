import lldb

class Array:
    def __init__(self, frame, array_name, size_name):
        self.array_name = array_name
        self.array_ref = Array.__get_array_ref(frame, array_name)
        self.size = Array.__get_size(frame, size_name)
        self.byte_size = self.array_ref.Dereference().GetByteSize()

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
        values = (self.array_ref.GetChildAtIndex(i, lldb.eDynamicCanRunTarget, True).GetValue() for i in range(self.size))
        return tuple(int(val, 0) if type(val) is int else val for val in values)

    def get_referenced_index(self, pointer: lldb.SBValue) -> int:
        """
        Get the index of the element that is referenced by the pointer value.
        Returns None otherwise
        """
        if not pointer.TypeIsPointerType():
            return None
        
        index = (int(pointer.GetValue(), 0) - int(self.array_ref.GetValue(), 0)) / self.byte_size
        if index >= 0 and index < self.size:
            return index
        return None
