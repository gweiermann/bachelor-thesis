import copy
from .postprocessor import Postprocessor

class KeepTrackOfItems(Postprocessor):
    """
    Skip the steps where the same item is swapped between two different positions.
    Since items could have the same value we need to keep track of which are which.
    It can detect one simple swap of items. Otherwise it supposes a new item got added.
    It enriches each item of a step with { id, value, orderId }, where id is unique for each item, value is the value of the item and orderId is the order of the item in the original list.
    - When an item gets swapped, the id and the orderId will get swapped as well.
    - When a new item gets added (value is replaced by a new value), it will generate a new id, but orderId will stay the same.
    """

    def setup(self, array):
        self.array_key = array

    def process(self, collected_step):
        lst = [{**copy.deepcopy(step), self.key: None} for step in collected_step]
        filtered = list(filter(lambda x: self.array_key in x and x[self.array_key] is not None, lst))
        for i, current_step in enumerate(filtered):
            self.handle_step(current_step, i, filtered)
        return lst

    def handle_step(self, current_step, index, collected_list):
        """
        Detect whether there was a swap or a change in the current step.
        Mutates the current step to add the information about the swap or change.
        """

        if index < 1:
            return
        
        previous_list = collected_list[index - 1][self.array_key]
        current_list = current_step[self.array_key]

        first_change = self.find_changed_index(previous_list, current_list)
        if first_change is None:
            raise ValueError("The steps are supposed to be different each step")
        
        second_change = self.find_changed_index(previous_list, current_list, first_change + 1)
        if second_change is None:
            # no swap behaviour, only one item changed, so we assume a new item got added
            return {**current_step, self.key: {
                'type': 'replace',
                'index': first_change,
                'oldValue': current_list[first_change],
                'newValue': current_list[first_change]
            }}
        
        if self.find_changed_index(current_list, previous_list, second_change + 1) is not None:
            raise ValueError("It's unexpected that a step can have more than two changes")
        
        # potential swap behaviour
        if previous_list[first_change] == current_list[second_change] and previous_list[second_change] == current_list[first_change]:
            # it's indeed a swap
            return {**current_step, self.key: {
                'type': 'swap',
                'index1': first_change,
                'index2': second_change
            }}
        print(f"Unexpected behaviour: {previous_list} -> {current_list}; {index}")
        raise ValueError("It's unexpected that a step can have more than one new item that is not swapped with another item")        
        
    def find_changed_index(self, list1, list2, startIndex=0):
        """
        Find the index of the changed item in the current step compared to the previous step.
        """
        if len(list1) != len(list2):
            raise ValueError("The two lists must have the same length.")
        for i in range(startIndex, len(list1)):
            if list1[i] != list2[i]:
                return i
        return None
    