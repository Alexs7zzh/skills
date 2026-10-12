"""Coordinator-only definitions of synthetic prior and current assessments."""

from copy import deepcopy


ASSEMBLER = "fixture-assembler"


def question(key, text, inputs, checks):
    return {"id": key, "question": text, "inputs": inputs, "checks": checks}


def answer(key, text, evidence, actor=ASSEMBLER, findings=()):
    return {"id": key, "actor": actor, "result": "findings" if findings else "clear",
            "answer": text, "evidence": evidence, "next": "", "findings": list(findings)}


def checks(ids, cost):
    choices = {
        "outcome": ("yes", "The function's result is compared with contract.md for the requested source."),
        "state": ("no", "The function retains no state or resource across calls; its local values do not outlive the call."),
        "async": ("no", "The source is synchronous and has no callbacks, queue, timer or thread."),
        "boundary": ("yes", "The declared input contract determines the function's correct result."),
        "failure": ("no", "All allowed inputs have a result; the stated caller preconditions exclude missing or malformed inputs."),
        "compatibility": ("no", "No serialized format, historical data or supported version interpretation changes in this assessment revision."),
        "cost": ("yes" if cost else "no", "The source traversal is checked against the contract's input and output bounds." if cost else "The source performs fixed integer arithmetic with no loop, blocking operation or cost claim."),
        "design": ("no", "The request revises an assessment of fixed source; it proposes no state, API or architecture change."),
        "evidence": ("yes", "The answers rely on explicit source arguments for the identified source bytes."),
        "integration": ("no", "The requested behavior is owned by this one synchronous function under the supplied caller contract."),
    }
    if set(ids) != set(choices):
        raise ValueError("update the scoped fixture for the candidate's changed check IDs")
    return [{"id": key, "applies": choices[key][0], "basis": choices[key][1]} for key in ids]


def assessments(case, ids, target):
    filename = {"R6": "chunks.py", "R7": "rates.py", "R8": "seats.py"}[case]
    inputs = ["source/" + filename, "contract.md"]
    prior = {"phase": "assessment", "actor": ASSEMBLER,
             "request": "Assess " + inputs[0] + " against the supplied contract.",
             "inputs": inputs, "target": target,
             "baseline": "none: this revision changes assessment records, not source",
             "checks": checks(ids, cost=case != "R8"),
             "questions": [], "answers": [], "findings": []}
    if case == "R6":
        prior["questions"] = [
            question("Q-bounds", "Do all returned ranges stay within the declared total?", inputs,
                     ["outcome", "boundary", "evidence"]),
            question("Q-coverage", "Do the ranges cover each index exactly once?", inputs,
                     ["outcome", "evidence"]),
            question("Q-cost", "Is work proportional to the number of output ranges?", inputs,
                     ["cost", "evidence"]),
        ]
        prior["answers"] = [
            answer("Q-bounds", "Every emitted stop is at most total, including a partial final chunk.",
                   "Source chunks.py:2-3: the final range for total=10 and width=4 is (8, 12)."),
            answer("Q-coverage", "The starts advance by width, so consecutive ranges meet without overlap; zero total has no starts.",
                   "Source chunks.py:2-3: each stop reaches the next start or total, with the last stop capped by min."),
            answer("Q-cost", "One pair is allocated for each output range; planning does not visit each represented index.",
                   "Source chunks.py:2-3: range(0, total, width) advances directly between starts."),
        ]
        current = deepcopy(prior)
        current["answers"][0]["evidence"] = "Source chunks.py:2-3: min(8 + 4, 10) gives the final range (8, 10) for total=10 and width=4."
    elif case == "R7":
        prior["questions"] = [
            question("Q-zone", "Does zone matching use the requested zone?", inputs,
                     ["outcome", "boundary", "evidence"]),
            question("Q-service", "Does each requested service receive its own quoted rate?", inputs,
                     ["outcome", "boundary", "evidence"]),
            question("Q-cost", "Is traversal bounded by the supplied rate list?", inputs,
                     ["cost", "evidence"]),
            question("Q-inputs", "Does lookup preserve the input sequence and rate objects?", inputs,
                     ["outcome", "evidence"]),
        ]
        prior["answers"] = [
            answer("Q-zone", "Exact string equality filters unrelated zones, including prefix-only names.",
                   "Source rates.py:13 filters rate.zone == zone.", "fixture-routing-investigator"),
            answer("Q-service", "Lookup returns the first matching zone without checking service. F1 describes the contract violation.",
                   "Source rates.py:12-13 receives service but does not use it in the filter.",
                   "fixture-pricing-investigator", ["F1"]),
            answer("Q-cost", "The generator visits at most the supplied 64 rates and stops at its first match.",
                   "Source rates.py:13 passes one generator to next; contract.md bounds the list at 64 and guarantees the requested pair is present.",
                   "fixture-routing-investigator"),
            answer("Q-inputs", "Lookup reads the sequence and frozen rate values without modifying either.",
                   "Source rates.py:5-13 defines frozen Rate objects and uses a read-only generator expression.",
                   "fixture-routing-investigator"),
        ]
        prior["findings"] = [{
            "id": "F1", "kind": "defect",
            "claim": "Rate lookup ignores the requested service.",
            "scenario": "Two services have distinct rates for one zone, and the requested service is second.",
            "obligation": "contract.md requires the rate for the exact zone/service pair regardless of input order.",
            "consequence": "The caller receives the first service's rate instead of the requested rate.",
            "evidence": "Source rates.py:12-13 checks zone only; next returns the first surviving rate.",
            "countercheck": "The caller guarantees that the requested pair exists, but it does not make a zone unique; several services per zone are allowed.",
        }]
        current = deepcopy(prior)
        current["questions"][0]["question"] = "Does zone matching reject a prefix-only match as well as a different zone?"
        current["questions"].append(question(
            "Q-zero", "Does lookup preserve a selected zero-cent value?", inputs,
            ["outcome", "boundary", "evidence"]))
        current["answers"].append(answer(
            "Q-zero", "Zero is returned unchanged for a selected rate, with no replacement value.",
            "Source rates.py:13 returns rate.cents directly, with no truthiness fallback or arithmetic.",
            "fixture-pricing-investigator"))
        current["findings"][0].update(
            scenario="Rates are EU/ground=500 then EU/express=900; quote_for(rates, 'EU', 'express') requests express.",
            consequence="The expression returns 500 cents rather than the required 900, underquoting this request by 400 cents.",
            evidence="Source rates.py:13 accepts EU/ground because the zone matches, and next returns its 500 cents before EU/express is considered.",
        )
    else:
        prior["questions"] = [question(
            "Q-allocation", "Does the allocation grant the allowed request and return the remaining capacity, including zeros?",
            inputs, ["outcome", "boundary", "evidence"])]
        prior["answers"] = [answer(
            "Q-allocation", "Granted seats are the lesser of capacity and request; remaining seats subtract that grant, so both zero cases and requests above capacity satisfy the contract.",
            "Source seats.py:2-3 uses min(capacity, requested) and capacity - granted with the contract's nonnegative integers.")]
        current = deepcopy(prior)
    return prior, current
