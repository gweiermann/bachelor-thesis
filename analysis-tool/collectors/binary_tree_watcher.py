from .collector import Collector
from datatypes import BinaryTreeNode, BinaryTreeNodeFrozen

class BinaryTreeWatcher(Collector):
    def setup(self, frame, *, name):
        var = frame.FindVariable(name)
        ty = var.Dereference().Dereference().GetType().GetName()
        address = var.GetValue()
        self.ref = frame.EvaluateExpression(f"(({ty}**) {address})") # needs to be mapped since lldb would reuse the variable for recursion calls which is not desired
        self.previous = None
        self.addresses = {}
    
    def step(self, frame):
        tree = BinaryTreeNode(self.ref.Dereference())
        if not tree.is_null():
            new = BinaryTreeNodeFrozen(tree)
            # print("step", new.ref.get_address())
            if self.previous is None:
                self.previous = new
                self.addresses = new.get_all_addresses()
                return [new.to_dict()]
    
            if new.is_equal(self.previous):
                return None
            
            # get all those trees (even these that got lost in the process)
            trees = [new.to_dict()]
            addresses = new.get_all_addresses()
            lost = { address: tree for address, tree in self.addresses.items() if address not in addresses }
        elif self.previous is None:
            return None
        else:
            addresses = {}
            lost = addresses
            new = None
            trees = []

        while lost != {}:
            _, node = lost.popitem()
            if node.is_null():
                continue
            next_tree = BinaryTreeNodeFrozen(BinaryTreeNode(node.ref))
            new_addresses = next_tree.get_all_addresses()
            lost = { address: tree for address, tree in lost.items() if address not in new_addresses }
            addresses.update(new_addresses)
            trees.append(next_tree.to_dict())

        self.addresses = addresses
        self.previous = new
        return trees  
    
    def is_reason_for_new_step(self):
        return True
    