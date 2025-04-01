from .postprocessor import Postprocessor

class SkipInterSwappingSteps(Postprocessor):
    """
    Skip the steps where the same item is swapped between two different positions.
    Because a swap operation could lead to a inbetween state where the swapping is not yet finished like in the following example:
    [1, 3, 2, 4] -> [1, 2, 2, 4] -> [1, 2, 3, 4]
    We want to skip the inbetween state and only show the final state of the swapping operation.
    """

    def setup(self, array):
        self.skip_next = False
        self.skip_information = None
        self.array_key = array

    def process(self, current_step, index, collected_list):
        """
        Skip the steps where the same item is swapped between two different positions.
        """

        if index == 0 or index == len(collected_list) - 1:
            return {**current_step, self.key: None}
        
        first = collected_list[index - 1][self.array_key]
        second = collected_list[index - 0][self.array_key]
        third = collected_list[index + 1][self.array_key]
        change_at_second = self.find_changed_index(first, second)
        change_at_third = self.find_changed_index(second, third)

        if change_at_second != change_at_third and second[change_at_second] == second[change_at_third] and first[change_at_second] == third[change_at_third]:
            self.skip_information = current_step
            return None

        current_step = {**current_step, self.key: self.skip_information}
        self.skip_information = None
            
        return current_step
        
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
        