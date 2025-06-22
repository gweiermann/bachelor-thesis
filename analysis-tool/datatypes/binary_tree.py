import lldb

class BinaryTreeNode:
    def ref_by_name(frame, variable_name):
        ref = frame.FindVariable(variable_name)
        if not ref:
            raise Exception(f"Can't find variable `{variable_name}` in scope.")
        return BinaryTreeNode(ref.Dereference())

    def __init__(self, ref):
        self.ref = ref


    def get_address(self):
        return self.ref.GetValue()

    def is_null(self):
        return not self.ref.IsValid() or self.ref.GetValue() == None or int(self.ref.GetValue(), 0) == 0
    
    def get_left(self):
        return BinaryTreeNode(self.ref.Dereference().GetChildMemberWithName("left"))
    
    def get_right(self):
        return BinaryTreeNode(self.ref.Dereference().GetChildMemberWithName("right"))
    
    def get_value(self):
        val = self.ref.Dereference().GetChildMemberWithName("data")
        if not val.IsValid():
            return None
        return val.GetValueAsSigned()
    
class BinaryTreeNodeFrozen:
    def __init__(self, root_node, visited_addresses=None):
        if root_node.is_null():
            raise Exception("Can't create a frozen node from a null node.")
        
        self.ref = root_node
        
        if visited_addresses is None:
            visited_addresses = set()

        self.address = root_node.get_address()

        # if self.address in visited_addresses:
        #     self.value = None
        #     self.left = None
        #     self.right = None
        #     return
        
        visited_addresses.add(self.address)

        self.value = root_node.get_value()
        left = root_node.get_left()
        right = root_node.get_right()
        self.left = None if left.is_null() else BinaryTreeNodeFrozen(left, visited_addresses)
        self.right = None if right.is_null() else BinaryTreeNodeFrozen(right, visited_addresses)

    def to_dict(self):
        return {
            "address": self.address,
            "value": self.value,
            "left": self.left and self.left.to_dict(),
            "right": self.right and self.right.to_dict()
        }

    def is_equal(self, other_tree, visited_addresses=None):
        if other_tree is None:
            return False
        
        if visited_addresses is None:
            visited_addresses = set()

        if self.address in visited_addresses:
            return self.address == other_tree.address
        
        visited_addresses.add(self.address)
        
        if self.address != other_tree.address:
            return False
        if self.value != other_tree.value:
            return False
        if self.left is None != other_tree.left is None:
            return False
        if self.right is None != other_tree.right is None:
            return False
        if self.left is not None and not self.left.is_equal(other_tree.left, visited_addresses):
            return False
        if self.right is not None and not self.right.is_equal(other_tree.right, visited_addresses):
            return False
        return True
    
    def get_all_addresses(self):
        addresses = { self.address: self.ref }
        if self.left is not None:
            addresses.update(self.left.get_all_addresses())
        if self.right is not None:
            addresses.update(self.right.get_all_addresses())
        return addresses
